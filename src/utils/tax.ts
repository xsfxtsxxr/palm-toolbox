/**
 * 个人所得税（工资薪金）计算引擎 —— 累计预扣法
 *
 * 累计应纳税所得额 = 累计收入 − 5,000 × 月份数 − 累计五险一金 − 累计专项附加扣除
 * 本月应扣税 = 累计应纳税所得额 × 预扣率 − 速算扣除数 − 累计已扣税（小于 0 时按 0 计）
 *
 * 说明：仅测算「工资薪金」的预扣预缴，默认全年收入、五险一金、专项附加扣除每月相同，
 * 不含年终奖、劳务报酬、稿酬、经营所得等，也未考虑减免税额与年度汇算清缴。
 */

/** 工资薪金每月减除费用（起征点），元 */
export const BASIC_DEDUCTION = 5000;

/** 测算月份数 */
export const MONTHS_IN_YEAR = 12;

export interface TaxBracket {
  /** 该档累计应纳税所得额上限（元） */
  upTo: number;
  /** 预扣率（小数） */
  rate: number;
  /** 速算扣除数（元） */
  quickDeduction: number;
}

/** 个人所得税预扣率表一（居民个人工资薪金所得预扣预缴适用） */
export const WITHHOLDING_BRACKETS: TaxBracket[] = [
  { upTo: 36_000, rate: 0.03, quickDeduction: 0 },
  { upTo: 144_000, rate: 0.1, quickDeduction: 2_520 },
  { upTo: 300_000, rate: 0.2, quickDeduction: 16_920 },
  { upTo: 420_000, rate: 0.25, quickDeduction: 31_920 },
  { upTo: 660_000, rate: 0.3, quickDeduction: 52_920 },
  { upTo: 960_000, rate: 0.35, quickDeduction: 85_920 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.45, quickDeduction: 181_920 },
];

export interface TaxInput {
  /** 月薪（元） */
  monthlySalary: number;
  /** 五险一金个人部分（元 / 月） */
  insurance: number;
  /** 专项附加扣除减免金额（元 / 月） */
  specialDeduction: number;
}

export interface TaxMonthRow {
  /** 月份，1 - 12 */
  month: number;
  /** 截至本月累计应纳税所得额 */
  taxable: number;
  /** 本月扣税 */
  tax: number;
  /** 截至本月累计扣税 */
  cumulativeTax: number;
  /** 本月到手工资 */
  netIncome: number;
}

export interface TaxResult {
  input: TaxInput;
  /** 逐月明细 */
  schedule: TaxMonthRow[];
  /** 全年收入 */
  annualIncome: number;
  /** 全年五险一金个人部分 */
  annualInsurance: number;
  /** 全年专项附加扣除 */
  annualSpecialDeduction: number;
  /** 全年应纳税所得额 */
  annualTaxable: number;
  /** 全年个税合计 */
  annualTax: number;
  /** 全年到手合计 */
  annualNet: number;
  /** 月均扣税 */
  monthlyAverageTax: number;
  /** 实际税负率（%，个税 ÷ 全年收入） */
  effectiveRate: number;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** 按累计应纳税所得额定位预扣率档位 */
export function getBracket(taxable: number): TaxBracket {
  return (
    WITHHOLDING_BRACKETS.find((bracket) => taxable <= bracket.upTo) ??
    WITHHOLDING_BRACKETS[WITHHOLDING_BRACKETS.length - 1]
  );
}

/** 累计应纳税额（未扣减已预缴部分） */
export function cumulativeTaxDue(taxable: number): number {
  if (taxable <= 0) return 0;
  const { rate, quickDeduction } = getBracket(taxable);
  return Math.max(0, round2(taxable * rate - quickDeduction));
}

/** 按月薪测算全年个税与逐月到手工资 */
export function calcTax(input: TaxInput): TaxResult {
  const monthlySalary = Math.max(0, input.monthlySalary);
  const insurance = Math.max(0, input.insurance);
  const specialDeduction = Math.max(0, input.specialDeduction);

  // 每月新增的应纳税所得额（未累计）
  const monthlyTaxable = Math.max(0, monthlySalary - BASIC_DEDUCTION - insurance - specialDeduction);

  const schedule: TaxMonthRow[] = [];
  let paidTax = 0;

  for (let month = 1; month <= MONTHS_IN_YEAR; month += 1) {
    const taxable = round2(monthlyTaxable * month);
    const due = cumulativeTaxDue(taxable);
    // 累计应扣小于已扣时本期不退税，按 0 计（差额留待年度汇算清缴）
    const tax = Math.max(0, round2(due - paidTax));
    paidTax = round2(paidTax + tax);

    schedule.push({
      month,
      taxable,
      tax,
      cumulativeTax: paidTax,
      netIncome: round2(monthlySalary - insurance - tax),
    });
  }

  const annualIncome = round2(monthlySalary * MONTHS_IN_YEAR);
  const annualInsurance = round2(insurance * MONTHS_IN_YEAR);
  const annualSpecialDeduction = round2(specialDeduction * MONTHS_IN_YEAR);
  const annualTax = paidTax;
  const annualNet = round2(schedule.reduce((sum, row) => sum + row.netIncome, 0));

  return {
    input: { monthlySalary, insurance, specialDeduction },
    schedule,
    annualIncome,
    annualInsurance,
    annualSpecialDeduction,
    annualTaxable: schedule[schedule.length - 1].taxable,
    annualTax,
    annualNet,
    monthlyAverageTax: round2(annualTax / MONTHS_IN_YEAR),
    effectiveRate: annualIncome > 0 ? round2((annualTax / annualIncome) * 100) : 0,
  };
}

/** 输入校验，返回错误提示；合法返回 null */
export function validateTaxInput(input: TaxInput): string | null {
  if (!(input.monthlySalary > 0)) return '请输入月薪';
  if (input.monthlySalary > 10_000_000) return '月薪金额过大，请检查后重试';
  if (input.insurance < 0) return '五险一金金额不能为负数';
  if (input.insurance >= input.monthlySalary) return '五险一金个人部分需小于月薪';
  if (input.specialDeduction < 0) return '专项附加扣除金额不能为负数';
  if (input.specialDeduction > 1_000_000) return '专项附加扣除金额过大，请检查后重试';
  return null;
}
