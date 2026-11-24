/**
 * 金价数据引擎单元测试
 *
 * 覆盖：新浪行情文本解析 / 零售 JSON 解析 / 组装 / 网络层 Referer 与反爬降级
 */
import {
  GOLD_CACHE_TTL,
  GOLD_RETAIL_API_URL,
  GOLD_SPOT_API_URL,
  GOLD_SPOT_REFERER,
  averageBrandPrice,
  averagePremium,
  buildGoldQuote,
  fetchGoldQuote,
  fmtGoldChange,
  fmtGoldPct,
  fmtGoldPrice,
  isBrandRow,
  isGoldCacheFresh,
  normalizeBrand,
  parseGoldRetail,
  parseGoldSpotText,
  sortBrands,
  splitBankName,
  toNumber,
  type GoldBrand,
} from './gold';

/** 新浪行情真实返回（中文名是 GBK 乱码，这里用中文占位，解析时不依赖） */
const SINA_TEXT = [
  'var hq_str_gds_AU9999="787.61,0,787.61,788.35,794.50,776.00,09:23:47,781.40,778.00,80594,43.00,83.00,2026-11-24,黄金99";',
  'var hq_str_gds_AUTD="787.89,0,788.03,788.32,793.26,776.28,09:23:49,780.24,777.79,8020,1.00,1.00,2026-11-24,黄金延期";',
  'var hq_str_gds_AGTD="10382.00,0,10380.00,10391.00,10551.00,9966.00,09:23:49,10149.00,10094.00,105454,127.00,40.00,2026-11-24,白银延期";',
  'var hq_str_gds_PT9995="326.49,0,0.00,328.35,327.29,323.51,15:24:01,325.90,327.29,38,0.00,10.00,2026-11-23,铂金99";',
  'var hq_str_gds_AG9999="";',
  'var hq_str_hf_XAU="3666.41,3635.230,3666.41,3666.76,3671.61,3619.71,09:28:00,3635.23,3630.52,0,0,0,2026-11-24,伦敦金";',
].join('\n');

/** 反爬校验页（原 tmini 接口失效后返回的内容） */
const GUARD_HTML = '<script src="/_guard/html.js?js=rotate_html"></script>';

/** 零售报价真实结构（截取关键字段） */
const RETAIL = {
  code: 200,
  msg: '数据请求成功',
  data: {
    precious_metal_price: [
      { brand: '菜百首饰', gold_price: '1098', platinum_price: '520', updated_date: '2026-11-24' },
      { brand: '周大福', gold_price: '1091', updated_date: '2026-11-24' },
      { brand: '老庙黄金', gold_price: '1088', updated_date: '2026-11-24' },
      { brand: '周大福', gold_price: '1091', updated_date: '2026-11-24' },
      { brand: '水贝黄金', gold_price: '944', updated_date: '2026-11-24' },
      { brand: '上金所黄金现货', gold_price: '788', updated_date: '2026-11-24' },
    ],
    bank_gold_bar_price: [
      { bank: '浦发银行投资金条', price: '802.0' },
      { bank: '农行传世之宝金条', price: '792.8' },
      { bank: '和谐平安金条', price: '795.0' },
      { bank: '工商银行如意金条', price: '791.4' },
    ],
    gold_recycle_price: [{ gold_type: '24K金回收', recycle_price: '761.0' }],
  },
};

const METALS = parseGoldSpotText(SINA_TEXT);
const QUOTE = buildGoldQuote(METALS, RETAIL);

describe('toNumber', () => {
  it('解析数字与带单位的字符串', () => {
    expect(toNumber(1242)).toBe(1242);
    expect(toNumber('1242')).toBe(1242);
    expect(toNumber('891.0 元/克')).toBe(891);
    expect(toNumber('1,242.5')).toBe(1242.5);
    expect(toNumber('-2.35')).toBe(-2.35);
  });

  it('非法值返回 0', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('')).toBe(0);
    expect(toNumber('暂无')).toBe(0);
    expect(toNumber(NaN)).toBe(0);
  });
});

describe('品牌过滤与规范化', () => {
  it('剔除国际品种、大盘基准价、投资金条与批发市场价', () => {
    expect(isBrandRow('周大福', '黄金')).toBe(true);
    expect(isBrandRow('伦敦金（现货黄金XAUUSD）', '4140.5')).toBe(false);
    expect(isBrandRow('黄金9999（上金所黄金现货）', '891.0元/克')).toBe(false);
    expect(isBrandRow('今日金价', '891.0')).toBe(false);
    expect(isBrandRow('投资类', '金条')).toBe(false);
    expect(isBrandRow('水贝黄金', '黄金')).toBe(false);
    expect(isBrandRow('', '黄金')).toBe(false);
  });

  it('品牌全称转简称', () => {
    expect(normalizeBrand('老庙黄金')).toBe('老庙');
    expect(normalizeBrand('菜百首饰')).toBe('菜百');
    expect(normalizeBrand('六福珠宝')).toBe('六福');
    expect(normalizeBrand('周大福')).toBe('周大福');
  });

  it('热门品牌排在前面', () => {
    const list: GoldBrand[] = [
      { brand: '金大福', price: 1235, premium: 0, date: '2026-11-24' },
      { brand: '周大福', price: 1242, premium: 0, date: '2026-11-24' },
      { brand: '老庙', price: 1240, premium: 0, date: '2026-11-24' },
    ];
    expect(sortBrands(list).map((item) => item.brand)).toEqual(['周大福', '老庙', '金大福']);
  });
});

describe('parseGoldSpotText（新浪行情）', () => {
  it('解析 Au99.99 的价、开、高、低与更新时间', () => {
    const spot = METALS.find((item) => item.name === 'Au99.99');
    expect(spot).toBeDefined();
    expect(spot?.price).toBe(787.61);
    expect(spot?.open).toBe(778);
    expect(spot?.high).toBe(794.5);
    expect(spot?.low).toBe(776);
    expect(spot?.updatedAt).toBe('2026-11-24 09:23:47');
    expect(spot?.unit).toBe('元/克');
  });

  it('涨跌相对今开计算', () => {
    const spot = METALS.find((item) => item.name === 'Au99.99');
    expect(spot?.change).toBe(9.61);
    expect(spot?.changePct).toBe(1.24);
  });

  it('保留各品种计价单位，跳过空品种', () => {
    const names = METALS.map((item) => item.name);
    expect(names).toEqual(['Au99.99', '黄金 T+D', '白银 T+D', '铂金 99.95', '伦敦金(现货黄金)']);
    expect(METALS.find((item) => item.name === '白银 T+D')?.unit).toBe('元/公斤');
    expect(METALS.find((item) => item.name === '伦敦金(现货黄金)')?.unit).toBe('美元/盎司');
  });

  it('接口返回反爬 HTML 时不产出任何品种（回归：旧接口失效）', () => {
    expect(parseGoldSpotText(GUARD_HTML)).toEqual([]);
    expect(parseGoldSpotText('Forbidden')).toEqual([]);
    expect(parseGoldSpotText('')).toEqual([]);
    expect(parseGoldSpotText(null as unknown as string)).toEqual([]);
  });

  it('价格非正的脏数据被跳过', () => {
    const broken = 'var hq_str_gds_AU9999="0,0,0,0,0,0,09:00:00,0,0,0,0,0,2026-11-24,x";';
    expect(parseGoldSpotText(broken)).toEqual([]);
  });
});

describe('银行名称拆分', () => {
  it('银行全称 + 产品', () => {
    expect(splitBankName('浦发银行投资金条')).toEqual({
      bank: '浦发银行',
      product: '投资金条',
    });
  });

  it('简称与特殊命名', () => {
    expect(splitBankName('农行传世之宝金条')).toEqual({
      bank: '农业银行',
      product: '传世之宝金条',
    });
    expect(splitBankName('和谐平安金条').bank).toBe('平安银行');
  });

  it('未识别时保留原文', () => {
    expect(splitBankName('某地方金条')).toEqual({ bank: '某地方金条', product: '投资金条' });
  });
});

describe('parseGoldRetail（零售报价）', () => {
  const retail = parseGoldRetail(RETAIL, 787.61);

  it('只保留真实品牌、去重并按热门度排序', () => {
    expect(retail.brands.map((item) => item.brand)).toEqual(['周大福', '老庙', '菜百']);
  });

  it('计算品牌相对基础金价的溢价与报价日期', () => {
    expect(retail.brands[0].price).toBe(1091);
    expect(retail.brands[0].premium).toBe(303.39);
    expect(retail.date).toBe('2026-11-24');
  });

  it('银行金条按价格升序并规范化银行名', () => {
    expect(retail.banks.map((item) => item.bank)).toEqual([
      '工商银行',
      '农业银行',
      '平安银行',
      '浦发银行',
    ]);
    expect(retail.banks[0].price).toBe(791.4);
  });

  it('结构异常时降级为空列表', () => {
    const empty = { brands: [], banks: [], date: '' };
    expect(parseGoldRetail(null, 0)).toEqual(empty);
    expect(parseGoldRetail('oops', 0)).toEqual(empty);
    expect(parseGoldRetail({}, 0)).toEqual(empty);
    expect(parseGoldRetail({ data: { precious_metal_price: [] } }, 0)).toEqual(empty);
  });
});

describe('buildGoldQuote', () => {
  it('组装出完整报价', () => {
    expect(QUOTE).not.toBeNull();
    expect(QUOTE?.date).toBe('2026-11-24');
    expect(QUOTE?.spot.name).toBe('Au99.99');
    expect(QUOTE?.spot.price).toBe(787.61);
    expect(QUOTE?.others.map((item) => item.name)).toEqual([
      '黄金 T+D',
      '白银 T+D',
      '铂金 99.95',
      '伦敦金(现货黄金)',
    ]);
    expect(QUOTE?.brands).toHaveLength(3);
    expect(QUOTE?.banks).toHaveLength(4);
  });

  it('缺少 Au99.99 时返回 null', () => {
    expect(buildGoldQuote([], RETAIL)).toBeNull();
    expect(buildGoldQuote(METALS.slice(1), RETAIL)).toBeNull();
  });

  it('零售源失败时现货仍可用，品牌与银行降级为空数组', () => {
    const quote = buildGoldQuote(METALS, null);
    expect(quote?.spot.price).toBe(787.61);
    expect(quote?.brands).toEqual([]);
    expect(quote?.banks).toEqual([]);
    expect(quote?.date).toBe('2026-11-24');
  });
});

describe('fetchGoldQuote（网络层）', () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = jest.fn();
  const okText = (body: string) => ({ ok: true, text: async () => body }) as unknown as Response;
  const fail = () => ({ ok: false, text: async () => '' }) as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('请求两个数据源，且新浪请求带 Referer', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === GOLD_SPOT_API_URL) return Promise.resolve(okText(SINA_TEXT));
      if (url === GOLD_RETAIL_API_URL) return Promise.resolve(okText(JSON.stringify(RETAIL)));
      return Promise.resolve(fail());
    });

    const quote = await fetchGoldQuote();
    expect(quote?.spot.price).toBe(787.61);
    expect(quote?.brands).toHaveLength(3);

    const spotCall = mockFetch.mock.calls.find(([url]) => url === GOLD_SPOT_API_URL);
    expect(spotCall?.[1]?.headers).toEqual({ Referer: GOLD_SPOT_REFERER });
  });

  it('现货源返回反爬 HTML 时返回 null，不再产出过期报价', async () => {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(url === GOLD_SPOT_API_URL ? okText(GUARD_HTML) : fail()),
    );
    await expect(fetchGoldQuote()).resolves.toBeNull();
  });

  it('零售源失败时现货照常返回', async () => {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(url === GOLD_SPOT_API_URL ? okText(SINA_TEXT) : fail()),
    );
    const quote = await fetchGoldQuote();
    expect(quote?.spot.price).toBe(787.61);
    expect(quote?.brands).toEqual([]);
  });

  it('请求抛异常时返回 null', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    await expect(fetchGoldQuote()).resolves.toBeNull();
  });
});

describe('统计与格式化', () => {
  const brands = QUOTE?.brands ?? [];

  it('品牌均价与平均溢价', () => {
    expect(averageBrandPrice(brands)).toBe(1092.33);
    expect(averagePremium(brands)).toBe(304.72);
    expect(averageBrandPrice([])).toBe(0);
    expect(averagePremium([])).toBe(0);
  });

  it('价格格式化', () => {
    expect(fmtGoldPrice(1242)).toBe('1242');
    expect(fmtGoldPrice(787.6)).toBe('787.60');
    expect(fmtGoldPrice(0)).toBe('--');
  });

  it('涨跌格式化', () => {
    expect(fmtGoldChange(1.234)).toBe('+1.23');
    expect(fmtGoldChange(-1.23)).toBe('-1.23');
    expect(fmtGoldChange(0)).toBe('0.00');
    expect(fmtGoldPct(1.234)).toBe('+1.23%');
    expect(fmtGoldPct(-0.5)).toBe('-0.50%');
    expect(fmtGoldPct(0)).toBe('0.00%');
  });

  it('缓存新鲜度按 5 分钟判断', () => {
    const now = 1792483000000;
    expect(GOLD_CACHE_TTL).toBe(5 * 60 * 1000);
    expect(isGoldCacheFresh(now, now)).toBe(true);
    expect(isGoldCacheFresh(now - GOLD_CACHE_TTL + 1, now)).toBe(true);
    expect(isGoldCacheFresh(now - GOLD_CACHE_TTL, now)).toBe(false);
    expect(isGoldCacheFresh(0, now)).toBe(false);
  });
});
