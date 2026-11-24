/**
 * 金价数据引擎
 *
 * 数据源（2026-11 起）：
 *  - 现货行情：新浪财经 hq.sinajs.cn（上金所 Au99.99 / 黄金 T+D / 白银 / 铂金 + 伦敦金）
 *    返回 GBK 文本且必须带 Referer；只解析 ASCII 数字字段，品种中文名自行映射。
 *  - 零售报价：v2.xxapi.cn/api/goldprice（品牌金店挂牌价 + 银行投资金条），JSON、零鉴权。
 *
 * 历史说明：原 tmini.net/api/gold-price 启用了 JS 安全校验，返回 HTML 而非 JSON。
 * 解析失败后 App 会静默回退到数周前的本地缓存，把过期价格当成「今日金价」展示，
 * 因此整体替换数据源，并在 goldStorage 中对过期缓存加了硬性上限。
 *
 * 本文件只做纯数据处理：解析、过滤、排序、涨跌与溢价计算；网络请求见文件末尾。
 */

/** 现货行情接口（上金所 + 伦敦金） */
export const GOLD_SPOT_API_URL =
  'https://hq.sinajs.cn/list=gds_AU9999,gds_AUTD,gds_AGTD,gds_PT9995,gds_AU100G,hf_XAU';
/** 新浪行情接口要求的 Referer，缺失会返回 Forbidden */
export const GOLD_SPOT_REFERER = 'https://finance.sina.com.cn';
/** 零售报价接口（品牌金店 + 银行金条） */
export const GOLD_RETAIL_API_URL = 'https://v2.xxapi.cn/api/goldprice';
/** 本地缓存 key（与 Web 端保持一致） */
export const GOLD_CACHE_KEY = 'gold_quote';
/** 缓存有效期：5 分钟（金价日内波动，缓存太长会失真） */
export const GOLD_CACHE_TTL = 5 * 60 * 1000;
/** 请求超时 */
export const GOLD_TIMEOUT = 12000;

export interface GoldSpot {
  /** 品种名称，如「Au99.99」 */
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
  /** 计价单位，如「元/克」「美元/盎司」「元/公斤」 */
  unit: string;
  /** 更新时间，如 2026-11-24 09:28:44 */
  updatedAt: string;
}

export interface GoldBrand {
  /** 品牌名（已规范化，如「老庙」） */
  brand: string;
  /** 挂牌价（元/克），不含工费 */
  price: number;
  /** 相对上金所基础金价的溢价（元/克） */
  premium: number;
  /** 报价日期，如 2026-11-24 */
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
  /** 报价日期，如 2026-11-24 */
  date: string;
  /** 上金所 Au99.99 现货 */
  spot: GoldSpot;
  /** 其他参考品种（黄金 T+D / 伦敦金 / 白银 / 铂金 / Au100g） */
  others: GoldSpot[];
  /** 品牌金店挂牌价 */
  brands: GoldBrand[];
  /** 银行投资金条 */
  banks: GoldBank[];
}

/**
 * 新浪品种代码 → 展示名 / 计价单位
 * 接口返回的名称是 GBK 乱码，不使用，统一在这里映射。
 */
const SPOT_NAMES: Record<string, { name: string; unit: string }> = {
  AU9999: { name: 'Au99.99', unit: '元/克' },
  AUTD: { name: '黄金 T+D', unit: '元/克' },
  AGTD: { name: '白银 T+D', unit: '元/公斤' },
  PT9995: { name: '铂金 99.95', unit: '元/克' },
  AU100G: { name: 'Au100g', unit: '元/克' },
  XAU: { name: '伦敦金(现货黄金)', unit: '美元/盎司' },
};

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

/** stores 里可能混着的非品牌行（国际品种 / 大盘基准价 / 批发市场价），需要剔除 */
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

/** 银行名称识别：接口返回「浦发银行投资金条」这类合并字符串，需拆成银行 + 产品 */
const BANK_ALIASES: [string, string][] = [
  ['浦发银行', '浦发银行'],
  ['工商银行', '工商银行'],
  ['农业银行', '农业银行'],
  ['农行', '农业银行'],
  ['中国银行', '中国银行'],
  ['建设银行', '建设银行'],
  ['建行', '建设银行'],
  ['交通银行', '交通银行'],
  ['邮储银行', '邮储银行'],
  ['和谐平安', '平安银行'],
  ['平安银行', '平安银行'],
  ['招商银行', '招商银行'],
  ['中信银行', '中信银行'],
  ['兴业银行', '兴业银行'],
  ['民生银行', '民生银行'],
  ['上海黄金交易所', '上海黄金交易所'],
];

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

/**
 * 解析新浪行情文本。
 *
 * 每行形如：var hq_str_gds_AU9999="787.61,0,787.61,788.35,794.50,776.00,09:23:47,781.40,778.00,...,2026-11-24,乱码";
 * 字段（逗号分隔）：0 最新价 / 4 最高 / 5 最低 / 6 时间 / 7 昨收 / 8 今开 / 12 日期 / 13 名称(GBK，忽略)
 * 休市或无效品种会返回空串，直接跳过。
 */
export function parseGoldSpotText(raw: string): GoldSpot[] {
  if (typeof raw !== 'string' || !raw) return [];
  const result: GoldSpot[] = [];
  const pattern = /hq_str_(?:gds|hf)_(\w+)="([^"]*)"/g;
  let matched: RegExpExecArray | null;

  while ((matched = pattern.exec(raw)) !== null) {
    const meta = SPOT_NAMES[matched[1]];
    if (!meta) continue;
    const fields = matched[2].split(',');
    const price = toNumber(fields[0]);
    if (price <= 0) continue;

    const open = toNumber(fields[8]) || price;
    const high = toNumber(fields[4]) || price;
    const low = toNumber(fields[5]) || price;
    const change = round2(price - open);
    const changePct = open > 0 ? round2((change / open) * 100) : 0;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(fields[12] ?? '') ? fields[12] : '';
    const time = /^\d{2}:\d{2}:\d{2}$/.test(fields[6] ?? '') ? fields[6] : '';
    const updatedAt = [date, time].filter(Boolean).join(' ');

    result.push({
      name: meta.name,
      price: round2(price),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      change,
      changePct,
      unit: meta.unit,
      updatedAt,
    });
  }
  return result;
}

/** 「浦发银行投资金条」→ { bank: '浦发银行', product: '投资金条' } */
export function splitBankName(raw: string): { bank: string; product: string } {
  const label = raw.trim();
  for (const [keyword, bank] of BANK_ALIASES) {
    if (label.includes(keyword)) {
      const product = label.replace(keyword, '').trim();
      return { bank, product: product || '投资金条' };
    }
  }
  return { bank: label, product: '投资金条' };
}

export interface GoldRetail {
  brands: GoldBrand[];
  banks: GoldBank[];
  /** 最新的品牌报价日期 */
  date: string;
}

/**
 * 解析零售报价 JSON。
 * 任何结构异常都降级为空数组（现货行情仍可独立展示）。
 */
export function parseGoldRetail(raw: unknown, basePrice = 0): GoldRetail {
  const empty: GoldRetail = { brands: [], banks: [], date: '' };
  if (!isRecord(raw)) return empty;
  const data = isRecord(raw.data) ? raw.data : raw;

  const brands = asArray(data.precious_metal_price)
    .filter(isRecord)
    .map((row) => {
      const brand = normalizeBrand(String(row.brand ?? ''));
      const price = round2(toNumber(row.gold_price));
      return {
        brand,
        price,
        premium: round2(price - basePrice),
        date: String(row.updated_date ?? '').trim(),
      };
    })
    .filter((item) => item.brand && item.price > 0 && isBrandRow(item.brand, ''));

  const uniqueBrands = brands.filter(
    (item, index) => brands.findIndex((other) => other.brand === item.brand) === index,
  );

  const banks = asArray(data.bank_gold_bar_price)
    .filter(isRecord)
    .map((row) => {
      const label = String(row.bank ?? '').trim();
      const { bank, product } = splitBankName(label);
      return { bank, product, price: round2(toNumber(row.price)) };
    })
    .filter((item) => item.bank && item.price > 0)
    .sort((a, b) => a.price - b.price);

  const dates = uniqueBrands
    .map((item) => item.date)
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();

  return { brands: sortBrands(uniqueBrands), banks, date: dates[dates.length - 1] ?? '' };
}

/**
 * 组装最终报价：现货必须有 Au99.99，零售数据可缺失。
 */
export function buildGoldQuote(metals: GoldSpot[], retailRaw: unknown): GoldQuote | null {
  const spot = metals.find((item) => item.name === 'Au99.99');
  if (!spot) return null;
  const retail = parseGoldRetail(retailRaw, spot.price);
  return {
    date: retail.date || spot.updatedAt.slice(0, 10),
    spot: { ...spot },
    others: metals.filter((item) => item !== spot),
    brands: retail.brands,
    banks: retail.banks,
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

/** 带超时的文本请求；失败统一返回 null，由上层走缓存降级 */
async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), GOLD_TIMEOUT) : null;
  try {
    const response = await fetch(url, {
      ...init,
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 请求两个数据源并组装报价；现货源失败时返回 null，零售源失败时降级为空列表 */
export async function fetchGoldQuote(): Promise<GoldQuote | null> {
  const [spotText, retailText] = await Promise.all([
    fetchText(GOLD_SPOT_API_URL, { headers: { Referer: GOLD_SPOT_REFERER } }),
    fetchText(GOLD_RETAIL_API_URL),
  ]);

  const metals = parseGoldSpotText(spotText ?? '');
  if (metals.length === 0) return null;

  let retailRaw: unknown = null;
  if (retailText) {
    try {
      retailRaw = JSON.parse(retailText) as unknown;
    } catch {
      retailRaw = null;
    }
  }
  return buildGoldQuote(metals, retailRaw);
}
