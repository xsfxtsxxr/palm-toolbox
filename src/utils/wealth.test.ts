/** 活期理财收益计算引擎单元测试 */
import { calcWealth, rawIncome, validateWealthInput } from './wealth';

const base = {
  principal: 100_000,
  mode: 'annualized' as const,
  annualRate: 3,
  wanfenIncome: 1.5,
  days: 365,
};

describe('calcWealth 七日年化', () => {
  it('10 万 / 3% / 365 天 => 收益 3000，本息 103000', () => {
    const result = calcWealth(base);
    expect(result.income).toBe(3000);
    expect(result.total).toBe(103_000);
    expect(result.dailyIncome).toBeCloseTo(8.22, 2);
  });

  it('持有 7 天按日计息', () => {
    const result = calcWealth({ ...base, days: 7 });
    // 100000 * 3% / 365 * 7 = 57.534
    expect(result.income).toBe(57.53);
    expect(result.dailyIncome).toBeCloseTo(8.22, 2);
  });

  it('天数翻倍收益翻倍（单利）', () => {
    const a = calcWealth({ ...base, days: 30 });
    const b = calcWealth({ ...base, days: 60 });
    expect(b.income).toBeCloseTo(a.income * 2, 1);
  });
});

describe('calcWealth 万份收益', () => {
  it('10 万 / 万份收益 1.5 元 / 365 天 => 收益 5475', () => {
    const result = calcWealth({ ...base, mode: 'wanfen' });
    expect(result.income).toBe(5475);
    expect(result.total).toBe(105_475);
    expect(result.dailyIncome).toBe(15);
  });

  it('1 万元持有 1 天的收益等于万份收益', () => {
    const result = calcWealth({
      principal: 10_000,
      mode: 'wanfen',
      annualRate: 0,
      wanfenIncome: 0.8,
      days: 1,
    });
    expect(result.income).toBe(0.8);
    expect(result.dailyIncome).toBe(0.8);
  });

  it('切换口径时只取对应参数', () => {
    const a = { ...base, mode: 'wanfen' as const, annualRate: 0 };
    const b = { ...base, mode: 'wanfen' as const, annualRate: 99 };
    expect(calcWealth(a).income).toEqual(calcWealth(b).income);
  });
});

describe('rawIncome 精度', () => {
  it('未取整收益用于日收益折算，避免二次舍入', () => {
    const input = { ...base, days: 7 };
    expect(rawIncome(input)).toBeCloseTo(57.534, 3);
    expect(calcWealth(input).dailyIncome).toBeCloseTo(8.22, 2);
  });
});

describe('validateWealthInput 输入校验', () => {
  it('合法输入通过', () => {
    expect(validateWealthInput(base)).toBeNull();
    expect(validateWealthInput({ ...base, mode: 'wanfen' })).toBeNull();
  });

  it('缺少本金 / 收益率 / 天数时返回提示', () => {
    expect(validateWealthInput({ ...base, principal: 0 })).toBe('请输入本金金额');
    expect(validateWealthInput({ ...base, annualRate: 0 })).toBe('请输入七日年化收益率');
    expect(validateWealthInput({ ...base, mode: 'wanfen', wanfenIncome: 0 })).toBe('请输入每万份收益');
    expect(validateWealthInput({ ...base, days: 0 })).toBe('持有天数需为大于 0 的整数');
    expect(validateWealthInput({ ...base, days: 1.5 })).toBe('持有天数需为大于 0 的整数');
    expect(validateWealthInput({ ...base, days: 4000 })).toBe('持有天数需在 1 - 3650 天之间');
  });

  it('收益率 / 万份收益超出上限时返回提示', () => {
    expect(validateWealthInput({ ...base, annualRate: 31 })).toBe('七日年化收益率需在 0 - 30% 之间');
    expect(validateWealthInput({ ...base, mode: 'wanfen', wanfenIncome: 101 })).toBe(
      '每万份收益需在 0 - 100 元之间',
    );
  });
});
