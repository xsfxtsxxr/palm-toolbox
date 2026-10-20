/** 全局类型定义 */

export type ToolIconName =
  | 'mortgage'
  | 'deposit'
  | 'tax'
  | 'currency'
  | 'unit'
  | 'ledger'
  | 'todo'
  | 'financial'
  | 'tomato'
  | 'calendar';

export interface Tool {
  id: string;
  name: string;
  subtitle: string;
  icon: ToolIconName;
  tile: 'blue' | 'green' | 'orange' | 'teal' | 'purple' | 'coral' | 'indigo' | 'red';
  /** 是否已实现（房贷 / 存款 / 理财 / 个税计算器已上线） */
  implemented: boolean;
  hot?: boolean;
}

/** 提前还款模式：减少月供（期限不变） / 缩短期限（月供不变） */
export type PrepayMode = 'reducePayment' | 'reduceTerm';

export interface MortgageInput {
  /** 剩余贷款总额（元） */
  remainingPrincipal: number;
  /** 提前偿还金额（元） */
  prepayAmount: number;
  /** 首次还款日期 - 年 */
  firstPaymentYear: number;
  /** 首次还款日期 - 月 */
  firstPaymentMonth: number;
  /** 首次还款日期 - 日 */
  firstPaymentDay: number;
  /** 贷款总期数（月） */
  totalMonths: number;
  /** 贷款年利率（%） */
  annualRate: number;
  /** 剩余期数（月） */
  remainingMonths: number;
  /** 还款方式（等额本息下的提前还款模式） */
  mode: PrepayMode;
}

export interface AmortizationRow {
  /** 期数（1 起） */
  period: number;
  /** 还款日期，如 2026.11.15 */
  paymentDate: string;
  /** 月供总额 */
  payment: number;
  /** 月供本金 */
  principal: number;
  /** 月供利息 */
  interest: number;
  /** 该期还完后剩余本金 */
  balance: number;
}

export interface MortgageResult {
  input: MortgageInput;
  /** 提前还款前月供 */
  originalMonthlyPayment: number;
  /** 提前还款后月供（缩短期限模式下与原月供相同） */
  newMonthlyPayment: number;
  /** 节省利息总额 */
  savedInterest: number;
  /** 提前还款前总利息 */
  totalInterestBefore: number;
  /** 提前还款后总利息 */
  totalInterestAfter: number;
  /** 提前还款后剩余期数 */
  newRemainingMonths: number;
  /** 缩短的月数（缩短期限模式下 > 0） */
  reducedMonths: number;
  /** 还款计划明细 */
  schedule: AmortizationRow[];
  /** 是否全额还清 */
  fullyRepaid: boolean;
  /** 计算时间戳 */
  createdAt: number;
}
