/**
 * 活期理财收益计算引擎（单利，按日计息）
 *
 * 七日年化：收益 = 本金 × 七日年化收益率 ÷ 365 × 持有天数
 * 万份收益：收益 = 本金 ÷ 10000 × 每万份收益 × 持有天数
 * 参考日收益 = 总收益 ÷ 持有天数
 */

export type WealthMode = 'annualized' | 'wanfen';

export interface WealthInput {
  /** 本金（元） */
  principal: number;
  /** 计算方式：七日年化 / 万份收益 */
  mode: WealthMode;
  /** 七日年化收益率（%） */
  annualRate: number;
  /** 每万份收益（元 / 万份 / 日） */
  wanfenIncome: number;
  /** 持有天数 */
  days: number;
}

export interface WealthResult {
  principal: number;
  mode: WealthMode;
  /** 总测算收益（元，保留 2 位小数） */
  income: number;
  /** 本息合计（元） */
  total: number;
  /** 参考日收益（元） */
  dailyIncome: number;
  annualRate: number;
  wanfenIncome: number;
  days: number;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** 按选中口径计算未取整的收益 */
export function rawIncome(input: WealthInput): number {
  const { principal, mode, annualRate, wanfenIncome, days } = input;
  if (mode === 'annualized') {
    return (principal * (annualRate / 100) * days) / 365;
  }
  return (principal / 10000) * wanfenIncome * days;
}

export function calcWealth(input: WealthInput): WealthResult {
  const raw = rawIncome(input);
  const income = round2(raw);
  const dailyIncome = input.days > 0 ? round2(raw / input.days) : 0;

  return {
    principal: input.principal,
    mode: input.mode,
    income,
    total: round2(input.principal + income),
    dailyIncome,
    annualRate: input.annualRate,
    wanfenIncome: input.wanfenIncome,
    days: input.days,
  };
}

/** 输入校验，返回错误提示；合法返回 null */
export function validateWealthInput(input: WealthInput): string | null {
  if (!(input.principal > 0)) return '请输入本金金额';
  if (input.principal > 1_000_000_000) return '本金金额过大，请检查后重试';
  if (input.mode === 'annualized') {
    if (!(input.annualRate > 0)) return '请输入七日年化收益率';
    if (input.annualRate > 30) return '七日年化收益率需在 0 - 30% 之间';
  } else {
    if (!(input.wanfenIncome > 0)) return '请输入每万份收益';
    if (input.wanfenIncome > 100) return '每万份收益需在 0 - 100 元之间';
  }
  if (!Number.isInteger(input.days) || input.days <= 0) return '持有天数需为大于 0 的整数';
  if (input.days > 3650) return '持有天数需在 1 - 3650 天之间';
  return null;
}
