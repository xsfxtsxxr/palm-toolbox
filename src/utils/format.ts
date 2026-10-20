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

/** 金额格式化为保留小数位 + 千分位，如 2310.68 -> "2,310.68" */
export function fmtDecimal(value: number, digits = 2): string {
  const sign = value < 0 ? '-' : '';
  const [intPart, decPart] = Math.abs(value).toFixed(digits).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return sign + (decPart ? `${grouped}.${decPart}` : grouped);
}

/** 金额格式化为 "¥2,310.68" 形式 */
export function fmtYuanDecimal(value: number, digits = 2): string {
  return '¥' + fmtDecimal(value, digits);
}

/** 日期格式化为 "2026-01-01" */
export function fmtDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 利率输入清洗：仅保留数字与一个小数点 */
export function sanitizeRateInput(raw: string, maxLength = 5): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  const normalized =
    dot < 0 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
  return normalized.slice(0, maxLength);
}

/** 输入框金额：仅保留数字并加千分位 */
export function fmtAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 输入框金额（支持指定位数小数）：保留数字与一个小数点，整数部分加千分位
 * 如 "12345.6" -> "12,345.6"，"0.5" -> "0.5"
 */
export function fmtDecimalInput(raw: string, maxDecimals = 2): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  const integerRaw = (dot < 0 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, '').slice(0, 12);
  const integerPart = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (dot < 0) return integerPart;
  const decimalPart = cleaned
    .slice(dot + 1)
    .replace(/\./g, '')
    .slice(0, Math.max(0, maxDecimals));
  return `${integerPart || '0'}.${decimalPart}`;
}

/** 输入框金额（两位小数） */
export function fmtMoneyInput(raw: string): string {
  return fmtDecimalInput(raw, 2);
}

/** 解析带千分位 / 小数的金额输入 */
export function parseMoney(text: string): number {
  const value = parseFloat(text.replace(/,/g, ''));
  return Number.isFinite(value) ? value : 0;
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

/** 还款日期标签：首期年月日 + 月份偏移，短月份按月末还款 */
export function paymentDateLabel(year: number, month: number, day: number, offset: number): string {
  const total = year * 12 + (month - 1) + offset;
  const targetYear = Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, lastDay);
  return `${targetYear}.${String(targetMonth).padStart(2, '0')}.${String(targetDay).padStart(2, '0')}`;
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
