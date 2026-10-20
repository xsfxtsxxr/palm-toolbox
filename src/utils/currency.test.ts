/** 汇率换算引擎单元测试 */
import {
  CURRENCIES,
  crossRate,
  convertAmount,
  fetchFxRates,
  fmtRate,
  isCacheFresh,
  parseFxResponse,
} from './currency';

const NOW = Date.UTC(2026, 9, 20, 6, 0, 0);
const RATES = { CNY: 1, USD: 0.14968, EUR: 0.13335, JPY: 23.687, HKD: 1.1748 };

const cacheAt = (fetchedAt: number) => ({
  base: 'CNY',
  date: '2026-10-19',
  fetchedAt,
  rates: RATES,
});

describe('parseFxResponse 接口解析', () => {
  it('保留有效汇率并补齐基准币种', () => {
    const parsed = parseFxResponse(
      {
        amount: 1,
        base: 'CNY',
        date: '2026-10-19',
        rates: { USD: 0.14968, EUR: 'x' as unknown as number, JPY: -1, HKD: 1.1748 },
      },
      NOW,
    );
    expect(parsed.rates).toEqual({ CNY: 1, USD: 0.14968, HKD: 1.1748 });
    expect(parsed.base).toBe('CNY');
    expect(parsed.date).toBe('2026-10-19');
    expect(parsed.fetchedAt).toBe(NOW);
  });

  it('缺少日期时使用当天日期', () => {
    const parsed = parseFxResponse({ base: 'CNY', rates: { USD: 0.15 } }, NOW);
    expect(parsed.date).toBe('2026-10-20');
  });

  it('无有效汇率时抛错', () => {
    expect(() => parseFxResponse({ base: 'CNY', rates: {} }, NOW)).toThrow('汇率数据为空');
  });
});

describe('isCacheFresh 缓存有效期', () => {
  it('1 小时内有效，超过 1 小时失效', () => {
    expect(isCacheFresh(cacheAt(NOW - 30 * 60 * 1000), NOW)).toBe(true);
    expect(isCacheFresh(cacheAt(NOW - 59 * 60 * 1000), NOW)).toBe(true);
    expect(isCacheFresh(cacheAt(NOW - 61 * 60 * 1000), NOW)).toBe(false);
    expect(isCacheFresh(cacheAt(NOW - 24 * 60 * 60 * 1000), NOW)).toBe(false);
  });
});

describe('crossRate / convertAmount 交叉汇率', () => {
  it('1 CNY = 0.14968 USD', () => {
    expect(crossRate(RATES, 'CNY', 'USD')).toBeCloseTo(0.14968, 6);
  });

  it('反向汇率为倒数：1 USD ≈ 6.6809 CNY', () => {
    expect(crossRate(RATES, 'USD', 'CNY')).toBeCloseTo(6.6809, 3);
  });

  it('同币种汇率为 1，缺少币种返回 0', () => {
    expect(crossRate(RATES, 'EUR', 'EUR')).toBe(1);
    expect(crossRate(RATES, 'CNY', 'TRY')).toBe(0);
  });

  it('万元换算：10000 CNY ≈ 1496.80 USD', () => {
    expect(convertAmount(10_000, RATES, 'CNY', 'USD')).toBeCloseTo(1496.8, 2);
    expect(convertAmount(100, RATES, 'USD', 'CNY')).toBeCloseTo(668.09, 2);
    expect(convertAmount(0, RATES, 'CNY', 'USD')).toBe(0);
  });
});

describe('fmtRate 汇率格式', () => {
  it('按量级选择小数位', () => {
    expect(fmtRate(0.14968)).toBe('0.1497');
    expect(fmtRate(7.18)).toBe('7.1800');
    expect(fmtRate(23.687)).toBe('23.6870');
    expect(fmtRate(2700.72)).toBe('2,700.72');
    expect(fmtRate(0)).toBe('--');
  });
});

describe('币种清单', () => {
  it('代码唯一且包含人民币', () => {
    const codes = CURRENCIES.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain('CNY');
    expect(codes.every((code) => /^[A-Z]{3}$/.test(code))).toBe(true);
  });
});

describe('fetchFxRates 接口请求', () => {
  const mockFetch = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('请求 CNY 基准的最新汇率', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ amount: 1, base: 'CNY', date: '2026-10-19', rates: { USD: 0.14968 } }),
    });

    const rates = await fetchFxRates(NOW);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('latest?from=CNY');
    expect(rates.rates.USD).toBe(0.14968);
    expect(rates.date).toBe('2026-10-19');
  });

  it('接口返回非 2xx 时抛错', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(fetchFxRates(NOW)).rejects.toThrow('HTTP 503');
  });

  it('网络异常时抛错', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    await expect(fetchFxRates(NOW)).rejects.toThrow('network down');
  });
});
