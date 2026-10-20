/**
 * 金价数据引擎
 *
 * 数据源：https://tmini.net/api/gold-price（免费公开接口，无需 key，CORS 全开放）
 * 一次请求同时返回：上金所现货品种（metals）+ 品牌金店挂牌价（stores）+ 银行投资金条（banks）
 *
 * 本文件只做纯数据处理：解析、过滤、排序、涨跌与溢价计算，不发请求。
 */

/** 金价接口地址 */
export const GOLD_API_URL = 'https://tmini.net/api/gold-price?type=json';
/** 本地缓存 key（与 Web 端保持一致） */
export const GOLD_CACHE_KEY = 'gold_quote';
/** 缓存有效期：5 分钟（金价日内波动，缓存太长会失真） */
export const GOLD_CACHE_TTL = 5 * 60 * 1000;
/** 请求超时 */
export const GOLD_TIMEOUT = 12000;

export interface GoldSpot {
  /** 品种名称，如「黄金9999」 */
  name: string;
  /** 最新价 */
  price: number;
  /** 今开 */
  open: number;
  /** 今日最高 */
  high: number;
  /** 今日最低 */
  low: number;
  /** 涨跌额（相对今开） */
  change: number;
  /** 涨跌幅（%） */
  changePct: number;
  /** 计价单位，如「元/克」「美元/盎司」 */
  unit: string;
  /** 更新时间，如 2026-10-20 16:03:11 */
  updatedAt: string;
}

export interface GoldBrand {
  /** 品牌名（已规范化，如「老庙」） */
  brand: string;
  /** 挂牌价（元/克），不含工费 */
  price: number;
  /** 相对上金所基础金价的溢价（元/克） */
  premium: number;
  /** 报价日期，如 2026-10-20 */
  date: string;
}

export interface GoldBank {
  /** 银行名，如「工商银行」 */
  bank: string;
  /** 产品名，如「如意金条」 */
  product: string;
  /** 价格（元/克） */
  price: number;
}

export interface GoldQuote {
  /** 报价日期，如 2026-10-20 */
  date: string;
  /** 上金所 Au99.99 现货 */
  spot: GoldSpot;
  /** 其他参考品种（黄金 T+D / 伦敦金 / 白银 / 铂金 / 钯金） */
  others: GoldSpot[];
  /** 品牌金店挂牌价 */
  brands: GoldBrand[];
  /** 银行投资金条 */
  banks: GoldBank[];
}

/** 品牌简称映射（接口返回的多为全称） */
const BRAND_ALIAS: Record<string, string> = {
  老庙黄金: '老庙',
  菜百首饰: '菜百',
  六福珠宝: '六福',
  水贝黄金: '水贝',
  中国黄金: '中国黄金',
};

/** 热门品牌展示顺序，未列出的品牌排在后面 */
const BRAND_ORDER = [
  '周大福',
  '老凤祥',
  '周生生',
  '老庙',
  '中国黄金',
  '菜百',
  '六福',
  '潮宏基',
  '谢瑞麟',
  '周六福',
  '周大生',
  '金大福',
];

/** stores 里混着的非品牌行（国际品种 / 大盘基准价 / 投资金条 / 批发市场价），需要剔除 */
const NON_BRAND_KEYWORDS = [
  '伦敦',
  '纽约',
  'COMEX',
  'XAUUSD',
  '现货黄金',
  '期货',
  '上金所',
  '今日金价',
  '黄金价格',
  '白银',
  '铂金',
  '钯金',
  '投资类',
  '金条',
  '水贝',
  '黄金9999',
  '黄金T+D',
];

/** 现货品种的匹配优先级 */
const SPOT_KEYS = ['黄金_9999', '黄金9999', 'Au99.99', '今日金价'];

/** 其他参考品种（按展示顺序） */
const OTHER_KEYS = ['黄金_T+D', '伦敦金', '白银价格', '铂金价格', '钯金价格'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** 从字符串 / 数字中提取数值，支持 "1242 元/克" 这类带单位的写法 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const matched = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!matched) return 0;
  const parsed = Number(matched[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** 品牌名规范化：取简称，并去掉多余空白 */
export function normalizeBrand(raw: string): string {
  const name = raw.trim();
  return BRAND_ALIAS[name] ?? name;
}

/** 是否为品牌金店的挂牌行 */
export function isBrandRow(brand: string, product: string): boolean {
  const text = `${brand}${product}`;
  if (!brand.trim()) return false;
  return !NON_BRAND_KEYWORDS.some((keyword) => text.includes(keyword));
}

/** 品牌排序：热门在前，其余保持接口原顺序 */
export function sortBrands(brands: GoldBrand[]): GoldBrand[] {
  const rank = (brand: string) => {
    const index = BRAND_ORDER.indexOf(brand);
    return index === -1 ? BRAND_ORDER.length : index;
  };
  return [...brands].sort((a, b) => {
    const diff = rank(a.brand) - rank(b.brand);
    return diff !== 0 ? diff : 0;
  });
}

/** 构造单个现货品种（涨跌相对今开） */
function buildSpot(raw: Record<string, unknown>): GoldSpot | null {
  const price = toNumber(raw.sell_price ?? raw.price);
  if (price <= 0) return null;
  const name = String(raw.name ?? '').trim();
  const open = toNumber(raw.today_price ?? raw.open_price) || price;
  const change = round2(price - open);
  const changePct = open > 0 ? round2((change / open) * 100) : 0;
  const high = toNumber(raw.high_price) || price;
  const low = toNumber(raw.low_price) || price;
  return {
    name,
    price: round2(price),
    open: round2(open),
    high: round2(high),
    low: round2(low),
    change,
    changePct,
    unit: String(raw.unit ?? '元/克').trim() || '元/克',
    updatedAt: String(raw.updated ?? '').trim(),
  };
}

/**
 * 解析接口返回
 * 任何结构异常都返回 null，由上层走缓存降级逻辑
 */
export function parseGoldQuote(raw: unknown): GoldQuote | null {
  if (!isRecord(raw)) return null;

  const date = String(raw.date ?? '').trim();
  const metals = asArray(raw.metals)
    .filter(isRecord)
    .map(buildSpot)
    .filter((item): item is GoldSpot => item !== null);

  if (metals.length === 0) return null;

  // 上金所 Au99.99：优先精确命中，其次退化为「今日金价」
  const spot =
    SPOT_KEYS.map((key) => metals.find((item) => item.name === key)).find(Boolean) ?? metals[0];

  const others = OTHER_KEYS.map((key) =>
    metals.find((item) => item.name.includes(key) && item.name !== spot.name),
  ).filter((item): item is GoldSpot => item !== undefined);

  const brands: GoldBrand[] = asArray(raw.stores)
    .filter(isRecord)
    .filter((row) => isBrandRow(String(row.brand ?? ''), String(row.product ?? '')))
    .map((row) => {
      const price = toNumber(row.price);
      return {
        brand: normalizeBrand(String(row.brand ?? '')),
        price: round2(price),
        premium: round2(price - spot.price),
        date: String(row.updated ?? date).trim(),
      };
    })
    // 去重 + 过滤异常价格（品牌金价一般远高于 0）
    .filter((item) => item.price > 0);

  const uniqueBrands = brands.filter(
    (item, index) => brands.findIndex((other) => other.brand === item.brand) === index,
  );

  const banks: GoldBank[] = asArray(raw.banks)
    .filter(isRecord)
    .map((row) => ({
      bank: String(row.bank ?? '').trim(),
      product: String(row.product ?? '投资金条').trim(),
      price: round2(toNumber(row.price)),
    }))
    .filter((item) => item.bank && item.price > 0)
    .sort((a, b) => a.price - b.price);

  return {
    date,
    spot: { ...spot, name: 'Au99.99' },
    others,
    brands: sortBrands(uniqueBrands),
    banks,
  };
}

/** 品牌平均挂牌价（无数据返回 0） */
export function averageBrandPrice(brands: GoldBrand[]): number {
  if (brands.length === 0) return 0;
  const total = brands.reduce((sum, item) => sum + item.price, 0);
  return round2(total / brands.length);
}

/** 品牌挂牌价相对基础金价的平均溢价，用于「品牌溢价」提示 */
export function averagePremium(brands: GoldBrand[]): number {
  if (brands.length === 0) return 0;
  const total = brands.reduce((sum, item) => sum + item.premium, 0);
  return round2(total / brands.length);
}

/** 价格展示：整数不带小数，其余保留 2 位 */
export function fmtGoldPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '--';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** 涨跌额展示：带符号，保留 2 位 */
export function fmtGoldChange(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  if (value > 0) return `+${fixed}`;
  if (value < 0) return `-${fixed}`;
  return '0.00';
}

/** 涨跌幅展示：带符号百分比 */
export function fmtGoldPct(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  if (value > 0) return `+${fixed}%`;
  if (value < 0) return `-${fixed}%`;
  return '0.00%';
}

/** 缓存是否新鲜 */
export function isGoldCacheFresh(fetchedAt: number, now = Date.now()): boolean {
  if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) return false;
  const age = now - fetchedAt;
  return age >= 0 && age < GOLD_CACHE_TTL;
}

/** 请求接口（超时保护） */
export async function fetchGoldQuote(): Promise<GoldQuote | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), GOLD_TIMEOUT) : null;
  try {
    const response = await fetch(GOLD_API_URL, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) return null;
    const raw: unknown = await response.json();
    return parseGoldQuote(raw);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
