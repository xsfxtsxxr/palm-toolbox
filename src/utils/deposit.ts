/**
 * 定期存款（整存整取）单利计算引擎
 *
 * 计息规则：
 *   利息 = 本金 × 年利率 × 存款年数 + 本金 × 日利率 × 零头天数
 *   日利率 = 年利率 ÷ 360，零头天数 = 月 × 30 + 天
 * 到期日按开户日「对年对月对日」推算，月末不足时取当月最后一天。
 */

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface DepositTerm {
  /** 存期 - 年 */
  years: number;
  /** 存期 - 月 */
  months: number;
  /** 存期 - 天 */
  days: number;
}

export interface DepositInput {
  /** 本金（元） */
  principal: number;
  /** 存期 */
  term: DepositTerm;
  /** 开户日（存款日期） */
  start: DateParts;
  /** 年利率（%） */
  annualRate: number;
}

export interface DepositResult {
  principal: number;
  /** 利息收益（元，保留 2 位小数） */
  interest: number;
  /** 本息合计（元，保留 2 位小数） */
  total: number;
  term: DepositTerm;
  /** 折算存期（年），= 年 + 月/12 + 天/360 */
  effectiveYears: number;
  /** 零头天数，= 月 × 30 + 天 */
  oddDays: number;
  /** 到期日 */
  maturity: DateParts;
  /** 实际日历天数（开户日 → 到期日） */
  calendarDays: number;
  annualRate: number;
}

/** 某年某月的天数（month 为 1-12） */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 日期加减：年 → 月 → 天，逐级对齐月末 */
export function addTerm(start: DateParts, term: DepositTerm): DateParts {
  const year = start.year + term.years;
  const month = start.month;
  const day = Math.min(start.day, daysInMonth(year, month));

  const totalMonths = year * 12 + (month - 1) + term.months;
  const y = Math.floor(totalMonths / 12);
  const m = (totalMonths % 12) + 1;
  const d = Math.min(day, daysInMonth(y, m));

  const result = new Date(y, m - 1, d + term.days);
  return { year: result.getFullYear(), month: result.getMonth() + 1, day: result.getDate() };
}

/** 两个日期之间的实际天数（按 UTC 计算，避免夏令时误差） */
export function daysBetween(from: DateParts, to: DateParts): number {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** 存期是否为空（年月日全为 0） */
export function isEmptyTerm(term: DepositTerm): boolean {
  return term.years <= 0 && term.months <= 0 && term.days <= 0;
}

/** 单利测算 */
export function calcDeposit(input: DepositInput): DepositResult {
  const { principal, term, start, annualRate } = input;
  const rate = annualRate / 100;

  const oddDays = term.months * 30 + term.days;
  const effectiveYears = term.years + term.months / 12 + term.days / 360;

  // 利息 = 本金 × 年利率 × 年数 + 本金 × (年利率 / 360) × 零头天数
  const interest = round2(principal * rate * term.years + principal * (rate / 360) * oddDays);
  const maturity = addTerm(start, term);

  return {
    principal,
    interest,
    total: round2(principal + interest),
    term,
    effectiveYears,
    oddDays,
    maturity,
    calendarDays: daysBetween(start, maturity),
    annualRate,
  };
}

/** 输入校验，返回错误提示；合法返回 null */
export function validateDepositInput(input: DepositInput): string | null {
  if (!(input.principal > 0)) return '请输入本金金额';
  if (input.principal > 1_000_000_000) return '本金金额过大，请检查后重试';
  if (isEmptyTerm(input.term)) return '请输入存款期限';
  if (input.term.years > 50 || input.term.months > 99 || input.term.days > 99) {
    return '存款期限过长，请检查年 / 月 / 天';
  }
  if (!(input.annualRate > 0)) return '请输入存款利率';
  if (input.annualRate > 24) return '存款利率需在 0 - 24% 之间';
  return null;
}
