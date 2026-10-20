/** 汇率缓存策略单元测试（缓存优先 → 请求 → 失败回退） */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FX_CACHE_KEY, type FxRates } from './currency';
import { loadFxRates, readFxCache, writeFxCache } from './fxCache';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const NOW = Date.UTC(2026, 9, 20, 6, 0, 0);
const HOUR = 60 * 60 * 1000;

const getItemMock = AsyncStorage.getItem as jest.Mock;
const setItemMock = AsyncStorage.setItem as jest.Mock;
const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

const buildCache = (fetchedAt: number): FxRates => ({
  base: 'CNY',
  date: '2026-10-19',
  fetchedAt,
  rates: { CNY: 1, USD: 0.14968, EUR: 0.13335 },
});

const apiPayload = {
  amount: 1,
  base: 'CNY',
  date: '2026-10-19',
  rates: { USD: 0.15234, EUR: 0.13456 },
};

beforeEach(() => {
  jest.clearAllMocks();
  getItemMock.mockResolvedValue(null);
  setItemMock.mockResolvedValue(undefined);
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('本地缓存读写', () => {
  it('读取合法缓存', async () => {
    getItemMock.mockResolvedValue(JSON.stringify(buildCache(NOW - 10 * 60 * 1000)));
    const cache = await readFxCache();
    expect(cache?.rates.USD).toBe(0.14968);
    expect(getItemMock).toHaveBeenCalledWith(FX_CACHE_KEY);
  });

  it('缓存损坏或不存在时返回 null', async () => {
    getItemMock.mockResolvedValue('{oops');
    expect(await readFxCache()).toBeNull();

    getItemMock.mockResolvedValue(null);
    expect(await readFxCache()).toBeNull();
  });

  it('写入缓存使用 fx_rates 作为 key', async () => {
    await writeFxCache(buildCache(NOW));
    expect(setItemMock).toHaveBeenCalledWith(FX_CACHE_KEY, expect.stringContaining('"base":"CNY"'));
  });
});

describe('loadFxRates 缓存优先策略', () => {
  it('缓存 1 小时内：直接使用，不请求接口', async () => {
    getItemMock.mockResolvedValue(JSON.stringify(buildCache(NOW - 30 * 60 * 1000)));

    const result = await loadFxRates({ now: NOW });
    expect(result?.source).toBe('cached');
    expect(result?.rates.rates.USD).toBe(0.14968);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('缓存超过 1 小时：请求接口并写入缓存', async () => {
    getItemMock.mockResolvedValue(JSON.stringify(buildCache(NOW - 2 * HOUR)));
    mockFetch.mockResolvedValue({ ok: true, json: async () => apiPayload });

    const result = await loadFxRates({ now: NOW });
    expect(result?.source).toBe('fresh');
    expect(result?.rates.rates.USD).toBe(0.15234);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(setItemMock).toHaveBeenCalledWith(FX_CACHE_KEY, expect.stringContaining('0.15234'));
  });

  it('缓存超过 1 小时且请求失败：回退旧缓存并标记 stale', async () => {
    getItemMock.mockResolvedValue(JSON.stringify(buildCache(NOW - 3 * HOUR)));
    mockFetch.mockRejectedValue(new Error('offline'));

    const result = await loadFxRates({ now: NOW });
    expect(result?.source).toBe('stale');
    expect(result?.rates.fetchedAt).toBe(NOW - 3 * HOUR);
    expect(setItemMock).not.toHaveBeenCalled();
  });

  it('无缓存且请求失败：返回 null', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    expect(await loadFxRates({ now: NOW })).toBeNull();
  });

  it('强制刷新时即使缓存新鲜也会请求；失败则回退新鲜缓存', async () => {
    getItemMock.mockResolvedValue(JSON.stringify(buildCache(NOW - 5 * 60 * 1000)));
    mockFetch.mockRejectedValue(new Error('offline'));

    const result = await loadFxRates({ force: true, now: NOW });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result?.source).toBe('cached');
    expect(result?.rates.rates.USD).toBe(0.14968);
  });
});
