/** 定期存款单利测算单元测试 */
import { addTerm, calcDeposit, daysBetween, validateDepositInput } from './deposit';

const start = { year: 2026, month: 10, day: 19 };

describe('addTerm 到期日推算', () => {
  it('对年对月对日', () => {
    expect(addTerm(start, { years: 1, months: 3, days: 0 })).toEqual({ year: 2028, month: 1, day: 19 });
  });

  it('月末不足时取当月最后一天', () => {
    expect(addTerm({ year: 2026, month: 1, day: 31 }, { years: 0, months: 1, days: 0 })).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
    expect(addTerm({ year: 2024, month: 1, day: 31 }, { years: 0, months: 1, days: 0 })).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  it('天数溢出进位到下个月', () => {
    expect(addTerm({ year: 2026, month: 12, day: 30 }, { years: 0, months: 0, days: 5 })).toEqual({
      year: 2027,
      month: 1,
      day: 4,
    });
  });

  it('月份超过 12 时进位到年', () => {
    expect(addTerm({ year: 2026, month: 6, day: 15 }, { years: 0, months: 18, days: 0 })).toEqual({
      year: 2027,
      month: 12,
      day: 15,
    });
  });
});

describe('daysBetween 实际天数', () => {
  it('一年为 365 天，闰年为 366 天', () => {
    expect(daysBetween({ year: 2026, month: 10, day: 19 }, { year: 2027, month: 10, day: 19 })).toBe(365);
    expect(daysBetween({ year: 2024, month: 1, day: 1 }, { year: 2025, month: 1, day: 1 })).toBe(366);
  });
});

describe('calcDeposit 单利测算', () => {
  it('10 万 / 1 年 / 1.55% => 利息 1550，本息 101550', () => {
    const result = calcDeposit({
      principal: 100_000,
      term: { years: 1, months: 0, days: 0 },
      start,
      annualRate: 1.55,
    });
    expect(result.interest).toBe(1550);
    expect(result.total).toBe(101_550);
    expect(result.maturity).toEqual({ year: 2027, month: 10, day: 19 });
    expect(result.calendarDays).toBe(365);
  });

  it('6 个月按半年计息', () => {
    const result = calcDeposit({
      principal: 100_000,
      term: { years: 0, months: 6, days: 0 },
      start,
      annualRate: 1.55,
    });
    expect(result.interest).toBe(775);
    expect(result.calendarDays).toBe(182);
  });

  it('零头天数按日利率（年利率 / 360）计息', () => {
    const result = calcDeposit({
      principal: 100_000,
      term: { years: 1, months: 0, days: 30 },
      start,
      annualRate: 1.55,
    });
    // 1550 + 100000 * 1.55% / 360 * 30 = 1679.17
    expect(result.interest).toBeCloseTo(1679.17, 2);
    expect(result.oddDays).toBe(30);
    expect(result.effectiveYears).toBeCloseTo(1 + 30 / 360, 6);
  });

  it('年 + 月 + 天组合与折算年数一致', () => {
    const result = calcDeposit({
      principal: 50_000,
      term: { years: 2, months: 3, days: 10 },
      start,
      annualRate: 2.05,
    });
    expect(result.interest).toBeCloseTo(50_000 * 0.0205 * (2 + 3 / 12 + 10 / 360), 2);
  });

  it('本金为 0 时结果为 0，不产生 NaN', () => {
    const result = calcDeposit({
      principal: 0,
      term: { years: 1, months: 0, days: 0 },
      start,
      annualRate: 1.55,
    });
    expect(result.interest).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('validateDepositInput 输入校验', () => {
  const base = {
    principal: 100_000,
    term: { years: 1, months: 0, days: 0 },
    start,
    annualRate: 1.55,
  };

  it('合法输入通过', () => {
    expect(validateDepositInput(base)).toBeNull();
  });

  it('缺少本金 / 期限 / 利率时返回提示', () => {
    expect(validateDepositInput({ ...base, principal: 0 })).toBe('请输入本金金额');
    expect(validateDepositInput({ ...base, term: { years: 0, months: 0, days: 0 } })).toBe('请输入存款期限');
    expect(validateDepositInput({ ...base, annualRate: 0 })).toBe('请输入存款利率');
    expect(validateDepositInput({ ...base, annualRate: 25 })).toBe('存款利率需在 0 - 24% 之间');
  });
});
