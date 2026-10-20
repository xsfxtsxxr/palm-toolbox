/**
 * 汇率换算引擎
 *
 * 数据源：Frankfurter（欧洲央行 ECB 参考汇率）
 * 接口：https://api.frankfurter.dev/v1/latest?from=CNY
 * 返回以 CNY 为基准的全部币种汇率，任意两种货币按交叉汇率换算。
 */

/** 汇率基准币种 */
export const FX_BASE = 'CNY';

/** Frankfurter 接口（api.frankfurter.app 已 301 至 api.frankfurter.dev/v1） */
export const FX_API_BASE = 'https://api.frankfurter.dev/v1';

/** 本地缓存 key（对应 Web 端 localStorage 的 fx_rates） */
export const FX_CACHE_KEY = 'fx_rates';

/** 缓存有效期：1 小时 */
export const FX_CACHE_TTL = 60 * 60 * 1000;

/** 请求超时 */
export const FX_REQUEST_TIMEOUT = 10_000;

export interface Currency {
  /** ISO 4217 代码 */
  code: string;
  /** 中文名称 */
  name: string;
}

/** Frankfurter 支持的币种（CNY 为基准，其余取自 ECB 参考汇率） */
export const CURRENCIES: Currency[] = [
  { code: 'CNY', name: '人民币' },
  { code: 'USD', name: '美元' },
  { code: 'EUR', name: '欧元' },
  { code: 'JPY', name: '日元' },
  { code: 'GBP', name: '英镑' },
  { code: 'HKD', name: '港币' },
  { code: 'KRW', name: '韩元' },
  { code: 'AUD', name: '澳元' },
  { code: 'CAD', name: '加元' },
  { code: 'SGD', name: '新加坡元' },
  { code: 'CHF', name: '瑞士法郎' },
  { code: 'THB', name: '泰铢' },
  { code: 'MYR', name: '马来西亚林吉特' },
  { code: 'NZD', name: '新西兰元' },
  { code: 'SEK', name: '瑞典克朗' },
  { code: 'NOK', name: '挪威克朗' },
  { code: 'DKK', name: '丹麦克朗' },
  { code: 'ISK', name: '冰岛克朗' },
  { code: 'INR', name: '印度卢比' },
  { code: 'BRL', name: '巴西雷亚尔' },
  { code: 'MXN', name: '墨西哥比索' },
  { code: 'ZAR', name: '南非兰特' },
  { code: 'TRY', name: '土耳其里拉' },
  { code: 'PLN', name: '波兰兹罗提' },
  { code: 'CZK', name: '捷克克朗' },
  { code: 'HUF', name: '匈牙利福林' },
  { code: 'ILS', name: '以色列新谢克尔' },
  { code: 'PHP', name: '菲律宾比索' },
  { code: 'IDR', name: '印尼盾' },
  { code: 'RON', name: '罗马尼亚列伊' },
];

/** 常用币种（选择器预设） */
export const COMMON_CURRENCY_CODES = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'HKD', 'AUD', 'CAD', 'SGD', 'KRW'];

/** 结果卡快捷币种（与设计稿一致） */
export const QUICK_CURRENCY_CODES = ['CNY', 'USD', 'EUR', 'JPY', 'HKD','KRW'];

const CURRENCY_MAP: Record<string, Currency> = CURRENCIES.reduce(
  (map, currency) => ({ ...map, [currency.code]: currency }),
  {},
);

export const currencyName = (code: string): string => CURRENCY_MAP[code]?.name ?? code;

export const isSupportedCurrency = (code: string): boolean => code in CURRENCY_MAP;

/** 本地缓存的汇率表 */
export interface FxRates {
  /** 基准币种，固定 CNY */
  base: string;
  /** 数据日期（ECB 参考汇率日期），如 2026-10-19 */
  date: string;
  /** 写入缓存的时间戳（毫秒） */
  fetchedAt: number;
  /** 1 基准币种可兑换的各国货币数量 */
  rates: Record<string, number>;
}

/** Frankfurter 接口返回体 */
export interface FxApiResponse {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
}

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const todayISO = (now: number) => new Date(now).toISOString().slice(0, 10);

/** 解析接口返回，剔除非法数值；无有效汇率时抛错 */
export function parseFxResponse(payload: FxApiResponse, now = Date.now()): FxRates {
  if (!payload || typeof payload !== 'object') throw new Error('汇率数据格式错误');

  const base = typeof payload.base === 'string' ? payload.base.toUpperCase() : FX_BASE;
  const rates: Record<string, number> = { [base]: 1 };

  Object.entries(payload.rates ?? {}).forEach(([code, value]) => {
    const rate = Number(value);
    if (Number.isFinite(rate) && rate > 0) rates[code.toUpperCase()] = rate;
  });

  if (Object.keys(rates).length <= 1) throw new Error('汇率数据为空');

  return {
    base,
    date: typeof payload.date === 'string' && payload.date ? payload.date : todayISO(now),
    fetchedAt: now,
    rates,
  };
}

/** 缓存是否仍在有效期内（默认 1 小时） */
export function isCacheFresh(cache: FxRates, now = Date.now(), ttl = FX_CACHE_TTL): boolean {
  return cache.fetchedAt > 0 && Math.abs(now - cache.fetchedAt) < ttl;
}

/** 交叉汇率：1 单位 from 可兑换的 to 数量 */
export function crossRate(rates: Record<string, number>, from: string, to: string): number {
  if (from === to) return 1;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return 0;
  return toRate / fromRate;
}

/** 金额换算（未取整） */
export function convertAmount(amount: number, rates: Record<string, number>, from: string, to: string): number {
  const rate = crossRate(rates, from, to);
  if (!rate || !Number.isFinite(amount)) return 0;
  return amount * rate;
}

/** 汇率展示：≥100 保留 2 位，≥0.01 保留 4 位，更小的保留 6 位 */
export function fmtRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '--';
  const digits = value >= 100 ? 2 : value >= 0.01 ? 4 : 6;
  const [intPart, decPart] = round(value, digits).toFixed(digits).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${grouped}.${decPart}` : grouped;
}

/** 拉取最新汇率（以 CNY 为基准，一次获取全部币种） */
export async function fetchFxRates(now = Date.now()): Promise<FxRates> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FX_REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${FX_API_BASE}/latest?from=${FX_BASE}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`汇率接口请求失败（HTTP ${response.status}）`);
    const payload = (await response.json()) as FxApiResponse;
    return parseFxResponse(payload, now);
  } finally {
    clearTimeout(timer);
  }
}
