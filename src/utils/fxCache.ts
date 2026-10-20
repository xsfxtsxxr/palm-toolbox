/**
 * 汇率本地缓存（对应 Web 端 localStorage 的 fx_rates）
 *
 * 流程：读缓存 → 1 小时内直接用 → 过期则请求接口 → 成功写缓存
 * → 失败回退上次缓存并标记 stale（页面提示「汇率可能过期」）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FX_CACHE_KEY, fetchFxRates, isCacheFresh, type FxRates } from './currency';

/** fresh：本次请求成功；cached：使用有效期内的缓存；stale：请求失败，回退过期缓存 */
export type FxSource = 'fresh' | 'cached' | 'stale';

export interface FxLoadResult {
  rates: FxRates;
  source: FxSource;
}

function isFxRates(value: unknown): value is FxRates {
  if (!value || typeof value !== 'object') return false;
  const cache = value as Partial<FxRates>;
  return (
    typeof cache.base === 'string' &&
    typeof cache.date === 'string' &&
    typeof cache.fetchedAt === 'number' &&
    !!cache.rates &&
    typeof cache.rates === 'object'
  );
}

/** 读取本地缓存，损坏或不存在时返回 null */
export async function readFxCache(): Promise<FxRates | null> {
  try {
    const raw = await AsyncStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isFxRates(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 写入本地缓存，失败不影响本次换算 */
export async function writeFxCache(rates: FxRates): Promise<void> {
  try {
    await AsyncStorage.setItem(FX_CACHE_KEY, JSON.stringify(rates));
  } catch {
    // 忽略写入异常（如存储空间不足）
  }
}

/** 按「缓存优先 + 失败回退」策略获取汇率 */
export async function loadFxRates(
  options: { force?: boolean; now?: number } = {},
): Promise<FxLoadResult | null> {
  const { force = false, now = Date.now() } = options;
  const cached = await readFxCache();

  if (!force && cached && isCacheFresh(cached, now)) {
    return { rates: cached, source: 'cached' };
  }

  try {
    const rates = await fetchFxRates(now);
    await writeFxCache(rates);
    return { rates, source: 'fresh' };
  } catch {
    if (!cached) return null;
    return { rates: cached, source: isCacheFresh(cached, now) ? 'cached' : 'stale' };
  }
}
