/** 房贷计算引擎单元测试 */
import {
  annuityPayment,
  buildSchedule,
  calcMortgage,
  getNextPaymentDate,
  getRemainingPaymentInfo,
  termFor,
  validateInput,
} from './mortgage';

const baseInput = {
  remainingPrincipal: 1_000_000,
  prepayAmount: 120_000,
  firstPaymentYear: 2026,
  firstPaymentMonth: 11,
  firstPaymentDay: 15,
  totalMonths: 360,
  annualRate: 4.9,
  remainingMonths: 360,
  mode: 'reducePayment' as const,
};

describe('annuityPayment 等额本息月供', () => {
  it('P=100万 / 4.9% / 360期 => 月供 5307.27', () => {
    const m = annuityPayment(1_000_000, 0.049 / 12, 360);
    expect(m).toBeCloseTo(5307.27, 1);
  });

  it('零利率时月供 = 本金 / 期数', () => {
    expect(annuityPayment(120_000, 0, 12)).toBeCloseTo(10_000, 6);
  });
});

describe('termFor 反解期数', () => {
  it('月供不变时反解期数与年金公式自洽', () => {
    const P = 880_000;
    const r = 0.049 / 12;
    const M = annuityPayment(P, r, 360);
    const n = termFor(P, r, M);
    expect(n).toBe(360);
  });
});

describe('buildSchedule 还款计划表', () => {
  it('末期剩余本金归零', () => {
    const rows = buildSchedule(1_000_000, 0.049 / 12, 5307.27, 2026, 11, 15, 360);
    expect(rows).toHaveLength(360);
    expect(rows[359].balance).toBeLessThan(0.01);
    expect(rows[0].paymentDate).toBe('2026.11.15');
    expect(rows[1].paymentDate).toBe('2026.12.15');
    expect(rows[11].paymentDate).toBe('2027.10.15');
  });

  it('总还款 - 本金 = 总利息', () => {
    const rows = buildSchedule(1_000_000, 0.049 / 12, 5307.27, 2026, 11, 15, 360);
    const totalPaid = rows.reduce((a, r) => a + r.payment, 0);
    const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
    expect(totalPaid - 1_000_000).toBeCloseTo(totalInterest, 4);
  });
});

describe('calcMortgage 提前还款测算', () => {
  it('减少月供：新月供低于原月供，节省利息约 10.9 万', () => {
    const result = calcMortgage(baseInput);
    expect(result.originalMonthlyPayment).toBeCloseTo(5307.27, 1);
    expect(result.newMonthlyPayment).toBeCloseTo(4670.4, 0);
    expect(result.newMonthlyPayment).toBeLessThan(result.originalMonthlyPayment);
    expect(result.savedInterest).toBeCloseTo(109_273.94, 0);
    expect(result.schedule).toHaveLength(360);
  });

  it('缩短期限：月供不变，期数缩短，节省利息更多', () => {
    const result = calcMortgage({ ...baseInput, mode: 'reduceTerm' });
    expect(result.newMonthlyPayment).toBeCloseTo(result.originalMonthlyPayment, 6);
    expect(result.newRemainingMonths).toBeLessThan(360);
    expect(result.reducedMonths).toBe(360 - result.newRemainingMonths);
    // 同样金额下，缩短期限比减少月供节省更多利息
    const reducePayment = calcMortgage(baseInput);
    expect(result.savedInterest).toBeGreaterThan(reducePayment.savedInterest);
  });

  it('提前还款越多，节省利息越多', () => {
    const small = calcMortgage({ ...baseInput, prepayAmount: 50_000 });
    const large = calcMortgage({ ...baseInput, prepayAmount: 300_000 });
    expect(large.savedInterest).toBeGreaterThan(small.savedInterest);
  });

  it('全额还清：无后续月供，节省全部剩余利息', () => {
    const result = calcMortgage({ ...baseInput, prepayAmount: 1_000_000 });
    expect(result.fullyRepaid).toBe(true);
    expect(result.newMonthlyPayment).toBe(0);
    expect(result.schedule).toHaveLength(0);
    expect(result.savedInterest).toBeCloseTo(result.totalInterestBefore, 4);
  });

  it('零利率场景可正常计算', () => {
    const result = calcMortgage({ ...baseInput, annualRate: 0, remainingMonths: 120 });
    expect(result.originalMonthlyPayment).toBeCloseTo(1_000_000 / 120, 6);
    expect(result.newMonthlyPayment).toBeCloseTo(880_000 / 120, 6);
    expect(result.savedInterest).toBe(0);
  });
});

describe('getRemainingPaymentInfo 最近还款日与剩余期数', () => {
  const firstPayment = { year: 2026, month: 1, day: 15 };

  it('扣款日当天仍从本月开始', () => {
    expect(getNextPaymentDate(firstPayment, new Date(2026, 4, 15))).toEqual({ year: 2026, month: 5, day: 15 });
    expect(getRemainingPaymentInfo(firstPayment, 360, new Date(2026, 4, 15)).remainingMonths).toBe(356);
  });

  it('超过本月扣款日后从下月开始并扣除已过期数', () => {
    expect(getRemainingPaymentInfo(firstPayment, 360, new Date(2026, 4, 16))).toEqual({
      year: 2026,
      month: 6,
      day: 15,
      remainingMonths: 355,
    });
  });

  it('短月份按月末生成扣款日', () => {
    expect(getNextPaymentDate({ year: 2026, month: 1, day: 31 }, new Date(2026, 1, 1))).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
  });
});

describe('validateInput 输入校验', () => {
  it('合法输入通过', () => {
    expect(validateInput({ remainingPrincipal: 1_000_000, prepayAmount: 120_000 })).toBeNull();
  });

  it('空值 / 超额返回错误信息', () => {
    expect(validateInput({ remainingPrincipal: 0, prepayAmount: 100 })).toBe('请输入剩余贷款总额');
    expect(validateInput({ remainingPrincipal: 1_000_000, prepayAmount: 0 })).toBe('请输入提前偿还金额');
    expect(validateInput({ remainingPrincipal: 1_000_000, prepayAmount: 1_000_000 })).toBe(
      '提前偿还金额需小于剩余贷款总额',
    );
  });
});
