/**
 * 金价缓存策略单元测试
 * 重点：超过 24 小时的旧缓存不得再作为「今日金价」展示（本次线上问题的回归用例）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOLD_CACHE_KEY, type GoldQuote } from './gold';
import { GOLD_STALE_MAX_AGE, loadGoldQuote, readGoldCache } from './goldStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const NOW = Date.UTC(2026, 10, 24, 2, 0, 0);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const QUOTE: GoldQuote = {
  date: '2026-11-24',
  spot: {
    name: 'Au99.99',
    price: 787.61,
    open: 778,
    high: 794.5,
    low: 776,
    change: 9.61,
    changePct: 1.24,
    unit: '元/克',
    updatedAt: '2026-11-24 09:23:47',
  },
  others: [],
  brands: [],
  banks: [],
};

const SINA_TEXT =
  'var hq_str_gds_AU9999="787.61,0,787.61,788.35,794.50,776.00,09:23:47,781.40,778.00,80594,43.00,83.00,2026-11-24,x";';

const getItemMock = AsyncStorage.getItem as jest.Mock;
const setItemMock = AsyncStorage.setItem as jest.Mock;
const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

const putCache = (fetchedAt: number, price = 787.61) => {
  const quote: GoldQuote = { ...QUOTE, spot: { ...QUOTE.spot, price } };
  getItemMock.mockResolvedValue(JSON.stringify({ quote, fetchedAt }));
  return quote;
};

const okText = (body: string) => ({ ok: true, text: async () => body }) as unknown as Response;
const fail = () => ({ ok: false, text: async () => '' }) as unknown as Response;

beforeEach(() => {
  jest.clearAllMocks();
  getItemMock.mockResolvedValue(null);
  setItemMock.mockResolvedValue(undefined);
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('readGoldCache', () => {
  it('损坏数据返回 null', async () => {
    getItemMock.mockResolvedValue('not json');
    await expect(readGoldCache()).resolves.toBeNull();
  });

  it('缺少关键字段的缓存返回 null', async () => {
    getItemMock.mockResolvedValue(JSON.stringify({ fetchedAt: NOW, quote: {} }));
    await expect(readGoldCache()).resolves.toBeNull();
  });
});

describe('loadGoldQuote', () => {
  it('5 分钟内直接读缓存，不发请求', async () => {
    const cached = putCache(NOW - MINUTE);
    const result = await loadGoldQuote({ now: NOW });
    expect(result?.source).toBe('cached');
    expect(result?.quote.spot.price).toBe(cached.spot.price);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('缓存过期但请求成功时写入新报价', async () => {
    putCache(NOW - 10 * MINUTE, 884.5);
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(url.includes('hq.sinajs.cn') ? okText(SINA_TEXT) : fail()),
    );

    const result = await loadGoldQuote({ now: NOW });
    expect(result?.source).toBe('fresh');
    expect(result?.quote.spot.price).toBe(787.61);
    expect(setItemMock).toHaveBeenCalledTimes(1);
    const [key, value] = setItemMock.mock.calls[0];
    expect(key).toBe(GOLD_CACHE_KEY);
    expect(JSON.parse(value).fetchedAt).toBe(NOW);
  });

  it('请求失败且缓存较新（<24h）时回退为 stale', async () => {
    putCache(NOW - 2 * HOUR, 884.5);
    mockFetch.mockResolvedValue(fail());

    const result = await loadGoldQuote({ now: NOW });
    expect(result?.source).toBe('stale');
    expect(result?.quote.spot.price).toBe(884.5);
  });

  it('请求失败且缓存超过 24 小时时返回 null，绝不展示旧价（回归用例）', async () => {
    putCache(NOW - GOLD_STALE_MAX_AGE, 884.5);
    mockFetch.mockResolvedValue(fail());

    await expect(loadGoldQuote({ now: NOW })).resolves.toBeNull();
  });

  it('几周前的缓存同样被丢弃', async () => {
    putCache(NOW - 35 * 24 * HOUR, 884.5);
    mockFetch.mockRejectedValue(new Error('offline'));
    await expect(loadGoldQuote({ now: NOW })).resolves.toBeNull();
  });

  it('无缓存且请求失败时返回 null', async () => {
    mockFetch.mockResolvedValue(fail());
    await expect(loadGoldQuote({ now: NOW })).resolves.toBeNull();
  });

  it('force 刷新时跳过新鲜度判断', async () => {
    putCache(NOW - MINUTE);
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(url.includes('hq.sinajs.cn') ? okText(SINA_TEXT) : fail()),
    );

    const result = await loadGoldQuote({ force: true, now: NOW });
    expect(result?.source).toBe('fresh');
    expect(mockFetch).toHaveBeenCalled();
  });
});
