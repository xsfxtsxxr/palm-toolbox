/** 格式化工具函数 */

/** 金额格式化为千分位整数（四舍五入到元），如 1728711 -> "1,728,711" */
export function fmtMoney(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 金额格式化为 "¥1,234" 形式 */
export function fmtYuan(value: number): string {
  return '¥' + fmtMoney(value);
}

/** 输入框金额：仅保留数字并加千分位 */
export function fmtAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 解析输入框金额字符串为数字 */
export function parseAmount(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** 期数标签：起始年月 + 偏移，如 (2026, 11, 0) -> "2026.11" */
export function monthLabel(year: number, month: number, offset: number): string {
  const total = year * 12 + (month - 1) + offset;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}.${String(m).padStart(2, '0')}`;
}

/** 当前年月 */
export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** 下一还款年月（默认值用） */
export function nextYearMonth(): { year: number; month: number } {
  const { year, month } = currentYearMonth();
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

/** 百分比格式，如 4.9 -> "4.9%" */
export function fmtPercent(rate: number): string {
  return `${Number(rate.toFixed(2))}%`;
}

/** 日期格式：2026 年 11 月 */
export function formatYearMonthCN(year: number, month: number): string {
  return `${year} 年 ${month} 月`;
}
