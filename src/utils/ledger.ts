/**
 * 记账本数据模型与统计工具
 *
 * 记录结构：{ id, type, amount, category, categoryIcon, date, time, note, createdAt }
 * 金额上限 999,999.99；日期为本地时区的 YYYY-MM-DD。
 */

export type LedgerType = 'expense' | 'income';

export interface LedgerCategory {
  id: string;
  name: string;
  /** 分类图标（emoji） */
  icon: string;
  /** 统计图表配色 */
  color: string;
}

/** 支出分类 */
export const EXPENSE_CATEGORIES: LedgerCategory[] = [
  { id: 'food', name: '餐饮', icon: '🍔', color: '#35B96E' },
  { id: 'transport', name: '交通', icon: '🚗', color: '#3E7BFA' },
  { id: 'shopping', name: '购物', icon: '🛒', color: '#F5A623' },
  { id: 'entertainment', name: '娱乐', icon: '🎬', color: '#FB7B4B' },
  { id: 'medical', name: '医疗', icon: '🏥', color: '#F05252' },
  { id: 'other', name: '其他', icon: '📝', color: '#98A2B3' },
];

/** 收入分类 */
export const INCOME_CATEGORIES: LedgerCategory[] = [
  { id: 'salary', name: '工资', icon: '💰', color: '#35B96E' },
  { id: 'bonus', name: '奖金', icon: '🏆', color: '#F5A623' },
  { id: 'investment', name: '理财', icon: '📈', color: '#3E7BFA' },
  { id: 'parttime', name: '兼职', icon: '💼', color: '#8B6FF0' },
  { id: 'gift', name: '红包', icon: '🎁', color: '#F05252' },
  { id: 'other', name: '其他', icon: '📝', color: '#98A2B3' },
];

export const CATEGORIES: Record<LedgerType, LedgerCategory[]> = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
};

/** 单笔金额上限 */
export const MAX_AMOUNT = 999_999.99;

export interface LedgerRecord {
  id: string;
  type: LedgerType;
  amount: number;
  category: string;
  categoryIcon: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  note: string;
  createdAt: number;
}

/** 新建 / 编辑时提交的字段 */
export interface LedgerDraft {
  type: LedgerType;
  amount: number;
  category: string;
  date: string;
  time: string;
  note: string;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const pad2 = (value: number) => String(value).padStart(2, '0');

export function categoryOf(type: LedgerType, id: string): LedgerCategory {
  const list = CATEGORIES[type];
  return list.find((item) => item.id === id) ?? list[list.length - 1];
}

export function createRecord(draft: LedgerDraft, now = Date.now()): LedgerRecord {
  return {
    id: `ledger-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type: draft.type,
    amount: round2(draft.amount),
    category: draft.category,
    categoryIcon: categoryOf(draft.type, draft.category).icon,
    date: draft.date,
    time: draft.time,
    note: draft.note.trim(),
    createdAt: now,
  };
}

export function applyDraft(record: LedgerRecord, draft: LedgerDraft): LedgerRecord {
  return {
    ...record,
    type: draft.type,
    amount: round2(draft.amount),
    category: draft.category,
    categoryIcon: categoryOf(draft.type, draft.category).icon,
    date: draft.date,
    time: draft.time,
    note: draft.note.trim(),
  };
}

/* ---------------- 日期 ---------------- */

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function nowTime(now = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function monthKeyOf(date: string): string {
  return date.slice(0, 7);
}

export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

/** '2026-10' -> '2026年10月' */
export function formatMonthCN(month: string): string {
  const [year, value] = month.split('-');
  return `${year}年${Number(value)}月`;
}

/** 月份偏移，如 ('2026-01', -1) -> '2025-12' */
export function shiftMonth(month: string, delta: number): string {
  const [year, value] = month.split('-').map(Number);
  const total = year * 12 + (value - 1) + delta;
  return `${Math.floor(total / 12)}-${pad2((total % 12) + 1)}`;
}

/** '2026-10-20' -> '10月20日' */
export function formatDateCN(date: string): string {
  const [, month, day] = date.split('-').map(Number);
  return `${month}月${day}日`;
}

/** '2026-10-20' -> '周二' */
export function weekdayCN(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()];
}

/* ---------------- 统计 ---------------- */

export interface LedgerSummary {
  expense: number;
  income: number;
  balance: number;
  count: number;
}

export interface LedgerDayGroup {
  date: string;
  records: LedgerRecord[];
  expense: number;
  income: number;
}

export interface CategorySlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

export interface MonthTrendPoint {
  month: string;
  label: string;
  expense: number;
  income: number;
  balance: number;
}

/** 按日期倒序、同一天按创建时间倒序 */
export function sortRecords(records: LedgerRecord[]): LedgerRecord[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

export function filterRecords(
  records: LedgerRecord[],
  options: { month?: string; type?: LedgerType | 'all' } = {},
): LedgerRecord[] {
  const { month, type = 'all' } = options;
  return sortRecords(
    records.filter((record) => {
      if (month && monthKeyOf(record.date) !== month) return false;
      if (type !== 'all' && record.type !== type) return false;
      return true;
    }),
  );
}

export function summarize(records: LedgerRecord[]): LedgerSummary {
  let expense = 0;
  let income = 0;
  records.forEach((record) => {
    if (record.type === 'expense') expense += record.amount;
    else income += record.amount;
  });
  return {
    expense: round2(expense),
    income: round2(income),
    balance: round2(income - expense),
    count: records.length,
  };
}

/** 按日期分组，附带当天的收入 / 支出小计 */
export function groupByDate(records: LedgerRecord[]): LedgerDayGroup[] {
  const sorted = sortRecords(records);
  const groups: LedgerDayGroup[] = [];

  sorted.forEach((record) => {
    let group = groups[groups.length - 1];
    if (!group || group.date !== record.date) {
      group = { date: record.date, records: [], expense: 0, income: 0 };
      groups.push(group);
    }
    group.records.push(record);
    if (record.type === 'expense') group.expense = round2(group.expense + record.amount);
    else group.income = round2(group.income + record.amount);
  });

  return groups;
}

/** 分类占比（默认支出），按金额从高到低 */
export function categoryBreakdown(
  records: LedgerRecord[],
  type: LedgerType = 'expense',
): CategorySlice[] {
  const totals = new Map<string, number>();
  let total = 0;

  records.forEach((record) => {
    if (record.type !== type) return;
    totals.set(record.category, (totals.get(record.category) ?? 0) + record.amount);
    total += record.amount;
  });

  return CATEGORIES[type]
    .map((category) => {
      const amount = round2(totals.get(category.id) ?? 0);
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        amount,
        percent: total > 0 ? round2((amount / total) * 100) : 0,
      };
    })
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/** 截至 endMonth 的近 count 个月趋势（按时间升序） */
export function monthlyTrend(
  records: LedgerRecord[],
  endMonth: string,
  count = 6,
): MonthTrendPoint[] {
  const points: MonthTrendPoint[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const month = shiftMonth(endMonth, -i);
    const summary = summarize(records.filter((record) => monthKeyOf(record.date) === month));
    points.push({
      month,
      label: `${Number(month.split('-')[1])}月`,
      expense: summary.expense,
      income: summary.income,
      balance: summary.balance,
    });
  }

  return points;
}

/** 最近 3 笔不重复金额（用于快速填入） */
export function recentAmounts(records: LedgerRecord[], limit = 3): number[] {
  const result: number[] = [];
  sortRecords(records).forEach((record) => {
    if (result.length >= limit) return;
    if (record.amount > 0 && !result.includes(record.amount)) result.push(record.amount);
  });
  return result;
}

/** 生成 CSV（按时间升序），字段：日期,时间,类型,分类,金额,备注 */
export function recordsToCSV(records: LedgerRecord[]): string {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const header = '日期,时间,类型,分类,金额,备注';
  const lines = [...records]
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
    .map((record) =>
      [
        record.date,
        record.time,
        record.type === 'expense' ? '支出' : '收入',
        categoryOf(record.type, record.category).name,
        record.amount.toFixed(2),
        escape(record.note),
      ].join(','),
    );

  return [header, ...lines].join('\n');
}

/** 校验金额，返回错误提示；合法返回 null */
export function validateAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return '请输入大于 0 的金额';
  if (amount > MAX_AMOUNT) return '单笔金额不能超过 999,999.99';
  return null;
}
