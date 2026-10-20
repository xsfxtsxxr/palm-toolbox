/** 个税（工资薪金累计预扣法）计算引擎单元测试 */
import { calcTax, cumulativeTaxDue, getBracket, validateTaxInput } from './tax';

const base = { monthlySalary: 20_000, insurance: 3_000, specialDeduction: 2_000 };

describe('预扣率表', () => {
  it('按累计应纳税所得额命中对应档位', () => {
    expect(getBracket(0).rate).toBe(0.03);
    expect(getBracket(36_000).rate).toBe(0.03);
    expect(getBracket(36_001).rate).toBe(0.1);
    expect(getBracket(144_000).rate).toBe(0.1);
    expect(getBracket(300_000).rate).toBe(0.2);
    expect(getBracket(420_000).rate).toBe(0.25);
    expect(getBracket(660_000).rate).toBe(0.3);
    expect(getBracket(960_000).rate).toBe(0.35);
    expect(getBracket(5_000_000).rate).toBe(0.45);
  });

  it('累计应纳税额 = 应纳税所得额 × 预扣率 − 速算扣除数', () => {
    expect(cumulativeTaxDue(0)).toBe(0);
    expect(cumulativeTaxDue(36_000)).toBe(1_080);
    expect(cumulativeTaxDue(144_000)).toBe(11_880);
    expect(cumulativeTaxDue(300_000)).toBe(43_080);
    expect(cumulativeTaxDue(420_000)).toBe(73_080);
    expect(cumulativeTaxDue(660_000)).toBe(145_080);
    expect(cumulativeTaxDue(960_000)).toBe(250_080);
    expect(cumulativeTaxDue(1_000_000)).toBe(268_080);
  });
});

describe('calcTax 累计预扣法测算', () => {
  it('月薪 2 万 / 五险一金 3 千 / 专项附加 2 千', () => {
    const result = calcTax(base);

    // 每月新增应纳税所得额 20000 − 5000 − 3000 − 2000 = 10000
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[0].taxable).toBe(10_000);
    expect(result.schedule[0].tax).toBe(300);
    expect(result.schedule[0].netIncome).toBe(16_700);

    // 第 4 个月累计 40000 进入 10% 档：1480 − 900 = 580
    expect(result.schedule[3].tax).toBe(580);
    expect(result.schedule[3].cumulativeTax).toBe(1_480);
    expect(result.schedule[3].netIncome).toBe(16_420);

    expect(result.schedule[11].tax).toBe(1_000);
    expect(result.annualTaxable).toBe(120_000);
    expect(result.annualTax).toBe(9_480);
    expect(result.annualIncome).toBe(240_000);
    expect(result.annualInsurance).toBe(36_000);
    expect(result.annualNet).toBe(194_520);
    expect(result.monthlyAverageTax).toBe(790);
    expect(result.effectiveRate).toBeCloseTo(3.95, 2);
  });

  it('年收入未超起征点时不产生个税', () => {
    const result = calcTax({ monthlySalary: 6_000, insurance: 500, specialDeduction: 1_000 });
    expect(result.schedule.every((row) => row.tax === 0)).toBe(true);
    expect(result.annualTax).toBe(0);
    expect(result.annualTaxable).toBe(0);
    expect(result.schedule[0].netIncome).toBe(5_500);
    expect(result.annualNet).toBe(66_000);
    expect(result.effectiveRate).toBe(0);
  });

  it('全年适用最低档：每月固定 3%', () => {
    const result = calcTax({ monthlySalary: 8_000, insurance: 1_000, specialDeduction: 1_000 });
    expect(result.schedule.every((row) => row.tax === 30)).toBe(true);
    expect(result.schedule[11].cumulativeTax).toBe(360);
    expect(result.annualTax).toBe(360);
    expect(result.annualNet).toBe(83_640);
    expect(result.effectiveRate).toBe(0.38);
  });

  it('跨多档的高收入：年末进入 30% 档', () => {
    const result = calcTax({ monthlySalary: 50_000, insurance: 5_000, specialDeduction: 0 });
    expect(result.schedule[0].tax).toBe(1_480);
    expect(result.schedule[3].tax).toBe(5_600);
    expect(result.schedule[7].tax).toBe(9_000);
    expect(result.schedule[10].tax).toBe(11_000);
    expect(result.schedule[11].tax).toBe(12_000);
    expect(result.annualTaxable).toBe(480_000);
    // 480000 × 30% − 52920
    expect(result.annualTax).toBe(91_080);
    expect(result.effectiveRate).toBeCloseTo(15.18, 2);
  });

  it('逐月税额非递减，且累计扣税等于逐月之和', () => {
    const result = calcTax({ monthlySalary: 45_000, insurance: 6_000, specialDeduction: 1_500 });
    const sum = result.schedule.reduce((acc, row) => acc + row.tax, 0);
    expect(result.schedule[11].cumulativeTax).toBeCloseTo(sum, 2);
    for (let i = 1; i < result.schedule.length; i += 1) {
      expect(result.schedule[i].tax).toBeGreaterThanOrEqual(result.schedule[i - 1].tax);
      expect(result.schedule[i].cumulativeTax).toBeCloseTo(
        result.schedule[i - 1].cumulativeTax + result.schedule[i].tax,
        2,
      );
    }
  });

  it('专项附加扣除越多，个税越少', () => {
    const low = calcTax({ monthlySalary: 30_000, insurance: 4_000, specialDeduction: 0 });
    const high = calcTax({ monthlySalary: 30_000, insurance: 4_000, specialDeduction: 3_000 });
    expect(high.annualTax).toBeLessThan(low.annualTax);
    expect(high.annualNet).toBeGreaterThan(low.annualNet);
  });

  it('月薪为 0 时不产生 NaN', () => {
    const result = calcTax({ monthlySalary: 0, insurance: 0, specialDeduction: 0 });
    expect(result.annualTax).toBe(0);
    expect(result.annualNet).toBe(0);
    expect(result.schedule.every((row) => Number.isFinite(row.tax))).toBe(true);
  });
});

describe('validateTaxInput 输入校验', () => {
  it('合法输入通过', () => {
    expect(validateTaxInput(base)).toBeNull();
    expect(validateTaxInput({ monthlySalary: 8_000, insurance: 0, specialDeduction: 0 })).toBeNull();
  });

  it('缺少月薪 / 金额异常时返回提示', () => {
    expect(validateTaxInput({ ...base, monthlySalary: 0 })).toBe('请输入月薪');
    expect(validateTaxInput({ ...base, monthlySalary: 20_000_000 })).toBe('月薪金额过大，请检查后重试');
    expect(validateTaxInput({ ...base, insurance: -1 })).toBe('五险一金金额不能为负数');
    expect(validateTaxInput({ ...base, insurance: 25_000 })).toBe('五险一金个人部分需小于月薪');
    expect(validateTaxInput({ ...base, specialDeduction: -1 })).toBe('专项附加扣除金额不能为负数');
  });
});
