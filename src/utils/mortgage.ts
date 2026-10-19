/**
 * 房贷计算引擎（等额本息 + 提前还款测算）
 *
 * 公式：
 *   月供 M = P × r × (1+r)^n / [(1+r)^n - 1]        （等额本息）
 *   其中 r = 年利率 / 12，n = 期数，P = 本金
 *
 * 提前还款两种模式：
 *   1. 减少月供（reducePayment）：期限不变，按剩余本金重新计算月供
 *   2. 缩短期限（reduceTerm）：月供不变，反解新的期数
 *
 * 舍入规则：计算过程保留双精度，展示层四舍五入到元；
 *          末期还款自动吸收尾差，保证剩余本金归零。
 */

import type {
  AmortizationRow,
  MortgageInput,
  MortgageResult,
} from '../types';
import { paymentDateLabel } from './format';

/** 安全上限，防止异常输入导致死循环 */
const MAX_PERIODS = 600;

/** 等额本息月供 */
export function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  const n = Math.max(1, Math.round(months));
  if (monthlyRate <= 0) return principal / n;
  const factor = Math.pow(1 + monthlyRate, n);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * 月供不变时，反解还清所需期数：
 *   n = -ln(1 - P·r/M) / ln(1+r)
 */
export function termFor(principal: number, monthlyRate: number, payment: number): number {
  if (monthlyRate <= 0) return Math.max(1, Math.ceil(principal / payment));
  const x = 1 - (principal * monthlyRate) / payment;
  if (x <= 0) return MAX_PERIODS; // 月供不足以覆盖利息，按上限截断
  return Math.max(1, Math.ceil(-Math.log(x) / Math.log(1 + monthlyRate)));
}

export interface PaymentDate {
  year: number;
  month: number;
  day: number;
}

/** 返回首个尚未到期的还款日；短月份按月末处理。 */
export function getNextPaymentDate(firstPayment: PaymentDate, asOf: Date = new Date()): PaymentDate {
  const today = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate()).getTime();
  for (let offset = 0; offset < MAX_PERIODS; offset++) {
    const total = firstPayment.year * 12 + (firstPayment.month - 1) + offset;
    const year = Math.floor(total / 12);
    const month = (total % 12) + 1;
    const day = Math.min(firstPayment.day, new Date(year, month, 0).getDate());
    if (new Date(year, month - 1, day).getTime() >= today) return { year, month, day };
  }
  const total = firstPayment.year * 12 + (firstPayment.month - 1) + MAX_PERIODS - 1;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month, day: Math.min(firstPayment.day, new Date(year, month, 0).getDate()) };
}

/** 计算从首期至最近未到期还款日（含）的剩余期数。 */
export function getRemainingPaymentInfo(
  firstPayment: PaymentDate,
  totalMonths: number,
  asOf: Date = new Date(),
): PaymentDate & { remainingMonths: number } {
  const totalMonthsClamped = Math.max(0, Math.min(MAX_PERIODS, Math.round(totalMonths)));
  const nextPayment = getNextPaymentDate(firstPayment, asOf);
  const offset = (nextPayment.year - firstPayment.year) * 12 + nextPayment.month - firstPayment.month;
  return {
    ...nextPayment,
    remainingMonths: offset >= totalMonthsClamped ? 0 : totalMonthsClamped - offset,
  };
}

/**
 * 生成还款计划表。payment 为月供，末期自动尾差调整。
 */
export function buildSchedule(
  principal: number,
  monthlyRate: number,
  payment: number,
  startYear: number,
  startMonth: number,
  startDay: number,
  maxPeriods: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const limit = Math.min(Math.max(1, Math.round(maxPeriods)), MAX_PERIODS);
  let balance = principal;

  for (let i = 1; i <= limit; i++) {
    const interest = balance * monthlyRate;
    let pay = payment;
    // 末期或足以一次还清时，按「剩余本金 + 当期利息」结清
    if (i === limit || pay >= balance + interest - 0.005) {
      pay = balance + interest;
    }
    const principalPart = pay - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      period: i,
      paymentDate: paymentDateLabel(startYear, startMonth, startDay, i - 1),
      payment: pay,
      principal: principalPart,
      interest,
      balance,
    });
    if (balance <= 0.005) break;
  }
  return rows;
}

function sumInterest(rows: AmortizationRow[]): number {
  return rows.reduce((acc, row) => acc + row.interest, 0);
}

/** 主入口：提前还款测算 */
export function calcMortgage(input: MortgageInput, asOf: Date = new Date()): MortgageResult {
  const {
    remainingPrincipal: P,
    prepayAmount,
    firstPaymentYear,
    firstPaymentMonth,
    firstPaymentDay,
    annualRate,
    remainingMonths: rawMonths,
    mode,
  } = input;

  const r = annualRate / 100 / 12;
  const n0 = Math.max(1, Math.min(MAX_PERIODS, Math.round(rawMonths)));
  const nextPayment = getNextPaymentDate({ year: firstPaymentYear, month: firstPaymentMonth, day: firstPaymentDay }, asOf);

  // —— 提前还款前 ——
  const M0 = annuityPayment(P, r, n0);
  const beforeSchedule = buildSchedule(P, r, M0, nextPayment.year, nextPayment.month, nextPayment.day, n0);
  const totalInterestBefore = sumInterest(beforeSchedule);

  // —— 提前还款后 ——
  const prepay = Math.max(0, Math.min(prepayAmount, P));
  const newPrincipal = P - prepay;
  const fullyRepaid = newPrincipal <= 0.005;

  let newMonthlyPayment: number;
  let schedule: AmortizationRow[];
  let newRemainingMonths: number;

  if (fullyRepaid) {
    // 一次性全额还清：无后续月供，节省全部剩余利息
    newMonthlyPayment = 0;
    schedule = [];
    newRemainingMonths = 0;
  } else if (mode === 'reducePayment') {
    // 减少月供：期限不变
    newMonthlyPayment = annuityPayment(newPrincipal, r, n0);
    newRemainingMonths = n0;
    schedule = buildSchedule(newPrincipal, r, newMonthlyPayment, nextPayment.year, nextPayment.month, nextPayment.day, n0);
  } else {
    // 缩短期限：月供不变，反解期数
    newMonthlyPayment = M0;
    newRemainingMonths = termFor(newPrincipal, r, M0);
    schedule = buildSchedule(newPrincipal, r, M0, nextPayment.year, nextPayment.month, nextPayment.day, newRemainingMonths);
  }

  const totalInterestAfter = sumInterest(schedule);
  const savedInterest = Math.max(0, totalInterestBefore - totalInterestAfter);

  return {
    input,
    originalMonthlyPayment: M0,
    newMonthlyPayment,
    savedInterest,
    totalInterestBefore,
    totalInterestAfter,
    newRemainingMonths,
    reducedMonths: fullyRepaid ? n0 : Math.max(0, n0 - newRemainingMonths),
    schedule,
    fullyRepaid,
    createdAt: Date.now(),
  };
}

/** 输入校验：返回错误信息，null 表示通过 */
export function validateInput(values: {
  remainingPrincipal: number;
  prepayAmount: number;
}): string | null {
  if (!values.remainingPrincipal || values.remainingPrincipal <= 0) {
    return '请输入剩余贷款总额';
  }
  if (!values.prepayAmount || values.prepayAmount <= 0) {
    return '请输入提前偿还金额';
  }
  if (values.prepayAmount >= values.remainingPrincipal) {
    return '提前偿还金额需小于剩余贷款总额';
  }
  return null;
}
