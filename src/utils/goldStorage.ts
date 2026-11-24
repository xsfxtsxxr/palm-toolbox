/**
 * 金价本地缓存（对应 Web 端 localStorage 的 gold_quote）
 *
 * 流程：读缓存 → 5 分钟内直接用 → 过期则请求接口 → 成功写缓存
 * → 失败回退上次缓存并标记 stale（页面提示「历史快照」）
 * → 缓存超过 24 小时则彻底丢弃，绝不把几天前的旧价当成今日金价展示
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOLD_CACHE_KEY, fetchGoldQuote, isGoldCacheFresh, type GoldQuote } from './gold';

/** 缓存最长可用时长：超过一天就不再展示（金价日内波动，隔夜价已无参考意义） */
export const GOLD_STALE_MAX_AGE = 24 * 60 * 60 * 1000;

/** fresh：本次请求成功；cached：使用有效期内的缓存；stale：请求失败，回退过期缓存 */
export type GoldSource = 'fresh' | 'cached' | 'stale';

export interface GoldCacheEntry {
  quote: GoldQuote;
  fetchedAt: number;
}

export interface GoldLoadResult {
  quote: GoldQuote;
  fetchedAt: number;
  source: GoldSource;
}

function isCacheEntry(value: unknown): value is GoldCacheEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<GoldCacheEntry>;
  if (typeof entry.fetchedAt !== 'number' || !entry.quote || typeof entry.quote !== 'object') {
    return false;
  }
  const quote = entry.quote as Partial<GoldQuote>;
  return (
    !!quote.spot &&
    typeof quote.spot.price === 'number' &&
    Array.isArray(quote.brands) &&
    Array.isArray(quote.banks)
  );
}

/** 读取本地缓存，损坏或不存在时返回 null */
export async function readGoldCache(): Promise<GoldCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(GOLD_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCacheEntry(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 写入本地缓存，失败不影响本次展示 */
export async function writeGoldCache(entry: GoldCacheEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(GOLD_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // 忽略写入异常（如存储空间不足）
  }
}

/** 按「缓存优先 + 失败回退」策略获取金价 */
export async function loadGoldQuote(
  options: { force?: boolean; now?: number } = {},
): Promise<GoldLoadResult | null> {
  const { force = false, now = Date.now() } = options;
  const cached = await readGoldCache();

  if (!force && cached && isGoldCacheFresh(cached.fetchedAt, now)) {
    return { quote: cached.quote, fetchedAt: cached.fetchedAt, source: 'cached' };
  }

  const quote = await fetchGoldQuote();
  if (quote) {
    await writeGoldCache({ quote, fetchedAt: now });
    return { quote, fetchedAt: now, source: 'fresh' };
  }

  if (!cached) return null;
  const age = now - cached.fetchedAt;
  // 时间戳异常或缓存过旧：宁可显示「获取失败」，也不要把几周前的价格冒充实时金价
  if (age < 0 || age >= GOLD_STALE_MAX_AGE) return null;
  return {
    quote: cached.quote,
    fetchedAt: cached.fetchedAt,
    source: isGoldCacheFresh(cached.fetchedAt, now) ? 'cached' : 'stale',
  };
}
