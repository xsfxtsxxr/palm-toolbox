/**
 * 金价数据引擎单元测试
 */
import {
  GOLD_CACHE_TTL,
  averageBrandPrice,
  averagePremium,
  fmtGoldChange,
  fmtGoldPct,
  fmtGoldPrice,
  isBrandRow,
  isGoldCacheFresh,
  normalizeBrand,
  parseGoldQuote,
  sortBrands,
  toNumber,
  type GoldBrand,
} from './gold';

/** 贴近接口真实返回的结构（截取关键字段） */
const RAW = {
  date: '2026-10-20',
  metals: [
    {
      name: '今日金价',
      sell_price: '884.33',
      today_price: '887.32',
      high_price: '892.78',
      low_price: '885.96',
      unit: '元/克',
      updated: '2026-10-20 16:03:11',
    },
    {
      name: '黄金_9999',
      sell_price: '889.70',
      today_price: '890.00',
      high_price: '898.00',
      low_price: '886.00',
      unit: '元/克',
      updated: '2026-10-20 16:03:11',
    },
    {
      name: '黄金_T+D',
      sell_price: '888.90',
      today_price: '889.65',
      high_price: '896.80',
      low_price: '885.80',
      unit: '元/克',
      updated: '2026-10-20 16:03:11',
    },
    {
      name: '伦敦金(现货黄金)',
      sell_price: '4122.13',
      today_price: '4122.26',
      high_price: '4146.9',
      low_price: '4115.61',
      unit: '美元/盎司',
      updated: '2026-10-20 16:03:11',
    },
    {
      name: '白银价格',
      sell_price: '12.849',
      today_price: '12.947',
      high_price: '13.03',
      low_price: '12.772',
      unit: '元/克',
      updated: '2026-10-20 16:03:11',
    },
    {
      name: '铂金价格',
      sell_price: '352.70',
      today_price: '354.10',
      high_price: '357.20',
      low_price: '352.00',
      unit: '元/克',
      updated: '2026-10-20 16:03:11',
    },
  ],
  stores: [
    { brand: '伦敦金（现货黄金XAUUSD）', product: '4140.5', price: '4140.5', unit: '元/克', updated: '2026-10-20' },
    { brand: '纽约黄金(COMEX期货黄金)', product: '4140.5', price: '4140.5', unit: '元/克', updated: '2026-10-20' },
    { brand: '黄金9999（上金所黄金现货）', product: '891.0元/克', price: '891.0元/克', unit: '元/克', updated: '2026-10-20' },
    { brand: '今日金价', product: '891.0', price: '891.0', unit: '元/克', updated: '2026-10-20' },
    { brand: '白银价格', product: '12.97', price: '12.97', unit: '元/克', updated: '2026-10-20' },
    { brand: '投资类', product: '金条', price: '905', unit: '元/克', updated: '2026-10-20' },
    { brand: '水贝黄金', product: '黄金', price: '1056', unit: '元/克', updated: '2026-10-20' },
    { brand: '周大福', product: '黄金', price: '1242', unit: '元/克', updated: '2026-10-20' },
    { brand: '老凤祥', product: '黄金', price: '1240', unit: '元/克', updated: '2026-10-20' },
    { brand: '老庙黄金', product: '黄金', price: '1240', unit: '元/克', updated: '2026-10-20' },
    { brand: '周生生', product: '黄金', price: '1236', unit: '元/克', updated: '2026-10-20' },
    { brand: '菜百首饰', product: '黄金', price: '1238', unit: '元/克', updated: '2026-10-20' },
    { brand: '中国黄金', product: '黄金', price: '1232', unit: '元/克', updated: '2026-10-20' },
    { brand: '周大福', product: '黄金', price: '1242', unit: '元/克', updated: '2026-10-20' },
  ],
  banks: [
    { bank: '农业银行', product: '投资金条', price: 911.7 },
    { bank: '工商银行', product: '如意金条', price: 906.55 },
    { bank: '民生银行', product: '投资金条', price: 904.28 },
  ],
};

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
      { brand: '金大福', price: 1235, premium: 0, date: '2026-10-20' },
      { brand: '周大福', price: 1242, premium: 0, date: '2026-10-20' },
      { brand: '老庙', price: 1240, premium: 0, date: '2026-10-20' },
    ];
    expect(sortBrands(list).map((item) => item.brand)).toEqual(['周大福', '老庙', '金大福']);
  });
});

describe('parseGoldQuote', () => {
  const quote = parseGoldQuote(RAW);

  it('解析出上金所 Au99.99', () => {
    expect(quote).not.toBeNull();
    expect(quote?.date).toBe('2026-10-20');
    expect(quote?.spot.name).toBe('Au99.99');
    expect(quote?.spot.price).toBe(889.7);
    expect(quote?.spot.open).toBe(890);
    expect(quote?.spot.high).toBe(898);
    expect(quote?.spot.low).toBe(886);
  });

  it('涨跌相对今开计算', () => {
    expect(quote?.spot.change).toBe(-0.3);
    expect(quote?.spot.changePct).toBe(-0.03);
  });

  it('只保留真实品牌，且去重', () => {
    const brands = quote?.brands.map((item) => item.brand) ?? [];
    expect(brands).toEqual(['周大福', '老凤祥', '周生生', '老庙', '中国黄金', '菜百']);
    expect(brands).not.toContain('伦敦金（现货黄金XAUUSD）');
    expect(brands).not.toContain('投资类');
    expect(brands).not.toContain('水贝');
  });

  it('计算品牌相对基础金价的溢价', () => {
    const dazf = quote?.brands.find((item) => item.brand === '周大福');
    expect(dazf?.price).toBe(1242);
    expect(dazf?.premium).toBe(352.3);
  });

  it('解析其他参考品种', () => {
    const names = quote?.others.map((item) => item.name) ?? [];
    expect(names).toEqual(['黄金_T+D', '伦敦金(现货黄金)', '白银价格', '铂金价格']);
  });

  it('保留各品种计价单位，避免把美元/盎司当元/克', () => {
    expect(quote?.spot.unit).toBe('元/克');
    const london = quote?.others.find((item) => item.name.includes('伦敦金'));
    expect(london?.unit).toBe('美元/盎司');
  });

  it('银行金条按价格升序', () => {
    expect(quote?.banks.map((item) => item.bank)).toEqual(['民生银行', '工商银行', '农业银行']);
  });

  it('结构异常时返回 null', () => {
    expect(parseGoldQuote(null)).toBeNull();
    expect(parseGoldQuote('oops')).toBeNull();
    expect(parseGoldQuote({})).toBeNull();
    expect(parseGoldQuote({ metals: [] })).toBeNull();
    expect(parseGoldQuote({ metals: [{ name: '黄金_9999', sell_price: '0' }] })).toBeNull();
  });

  it('缺少 stores / banks 时降级为空数组', () => {
    const minimal = parseGoldQuote({
      date: '2026-10-20',
      metals: [{ name: '黄金_9999', sell_price: '889.7', today_price: '890' }],
    });
    expect(minimal?.brands).toEqual([]);
    expect(minimal?.banks).toEqual([]);
    expect(minimal?.spot.price).toBe(889.7);
  });
});

describe('统计与格式化', () => {
  const brands = parseGoldQuote(RAW)?.brands ?? [];

  it('品牌均价与平均溢价', () => {
    expect(averageBrandPrice(brands)).toBe(1238);
    expect(averagePremium(brands)).toBe(348.3);
    expect(averageBrandPrice([])).toBe(0);
    expect(averagePremium([])).toBe(0);
  });

  it('价格格式化', () => {
    expect(fmtGoldPrice(1242)).toBe('1242');
    expect(fmtGoldPrice(889.7)).toBe('889.70');
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
