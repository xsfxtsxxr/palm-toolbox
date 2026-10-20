/**
 * 计算次数统计引擎
 *
 * 记录每个计算器被真正使用的次数（按钮类工具点「开始计算」算一次，
 * 实时类工具在改动过参数后离开页面算一次），并做今日 / 近 7 天 / 常用工具汇总。
 */
import type { ToolIconName } from '../types';
import type { TileThemeKey } from '../theme/theme';

export type CalcKind = 'mortgage' | 'deposit' | 'financial' | 'tax' | 'currency' | 'unit';

export interface CalcToolMeta {
  key: CalcKind;
  name: string;
  desc: string;
  icon: ToolIconName;
  tile: TileThemeKey;
}

/** 参与统计的计算器（顺序即默认展示顺序） */
export const CALC_TOOLS: CalcToolMeta[] = [
  { key: 'mortgage', name: '房贷计算', desc: '等额本息 / 提前还款', icon: 'mortgage', tile: 'blue' },
  { key: 'deposit', name: '存款计算', desc: '定期存款利息', icon: 'deposit', tile: 'green' },
  { key: 'financial', name: '理财收益', desc: '七日年化 / 万份收益', icon: 'financial', tile: 'purple' },
  { key: 'tax', name: '个税计算', desc: '工资到手测算', icon: 'tax', tile: 'orange' },
  { key: 'currency', name: '汇率换算', desc: 'Frankfurter 实时汇率', icon: 'currency', tile: 'teal' },
  { key: 'unit', name: '单位换算', desc: '长度 / 重量互转', icon: 'unit', tile: 'coral' },
];

export const CALC_KINDS = CALC_TOOLS.map((item) => item.key);

export function isCalcKind(value: unknown): value is CalcKind {
  return typeof value === 'string' && (CALC_KINDS as string[]).includes(value);
}

export function calcToolOf(kind: CalcKind): CalcToolMeta {
  return CALC_TOOLS.find((item) => item.key === kind) ?? CALC_TOOLS[0];
}

export interface CalcToolStat {
  /** 累计次数 */
  count: number;
  /** 最近一次使用时间戳 */
  lastAt: number | null;
  /** 最近一次的参数摘要，如「100万 · 30年」 */
  lastSummary: string;
}

export interface CalcStats {
  /** 累计次数 */
  total: number;
  tools: Record<CalcKind, CalcToolStat>;
  /** 'YYYY-MM-DD' → 当天次数（只保留最近 120 天） */
  days: Record<string, number>;
  updatedAt: number;
}

/** 连续打卡天数上限，避免异常数据撑爆统计 */
const MAX_STREAK = 365;
const MAX_DAYS = 120;

export function createEmptyStats(): CalcStats {
  const tools = {} as Record<CalcKind, CalcToolStat>;
  for (const kind of CALC_KINDS) {
    tools[kind] = { count: 0, lastAt: null, lastSummary: '' };
  }
  return { total: 0, tools, days: {}, updatedAt: 0 };
}

/** 本地时区的 YYYY-MM-DD */
export function dateKeyOf(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDaysToKey(key: string, offset: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + offset);
  return dateKeyOf(date.getTime());
}

/** 记录一次计算 */
export function recordCalc(
  stats: CalcStats,
  kind: CalcKind,
  summary = '',
  now: number = Date.now(),
): CalcStats {
  const key = dateKeyOf(now);
  const tools = { ...stats.tools };
  const current = tools[kind] ?? { count: 0, lastAt: null, lastSummary: '' };
  tools[kind] = {
    count: current.count + 1,
    lastAt: now,
    lastSummary: summary.trim() || current.lastSummary,
  };

  const days = { ...stats.days, [key]: (stats.days[key] ?? 0) + 1 };
  // 只保留最近 MAX_DAYS 天
  const keys = Object.keys(days).sort();
  if (keys.length > MAX_DAYS) {
    for (const stale of keys.slice(0, keys.length - MAX_DAYS)) delete days[stale];
  }

  return { total: stats.total + 1, tools, days, updatedAt: now };
}

/** 读取时的容错归一化 */
export function normalizeCalcStats(raw: unknown): CalcStats {
  const base = createEmptyStats();
  if (!raw || typeof raw !== 'object') return base;
  const source = raw as Partial<CalcStats>;

  const total = Number(source.total);
  base.total = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;

  if (source.tools && typeof source.tools === 'object') {
    for (const kind of CALC_KINDS) {
      const item = (source.tools as Record<string, unknown>)[kind];
      if (!item || typeof item !== 'object') continue;
      const record = item as Partial<CalcToolStat>;
      const count = Number(record.count);
      const lastAt = Number(record.lastAt);
      base.tools[kind] = {
        count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 0,
        lastAt: Number.isFinite(lastAt) && lastAt > 0 ? lastAt : null,
        lastSummary: typeof record.lastSummary === 'string' ? record.lastSummary.slice(0, 60) : '',
      };
    }
  }

  if (source.days && typeof source.days === 'object') {
    for (const [key, value] of Object.entries(source.days as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      const count = Number(value);
      if (!Number.isFinite(count) || count <= 0) continue;
      base.days[key] = Math.floor(count);
    }
  }

  base.updatedAt = Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : 0;
  // 计数与明细不一致时以明细为准，避免出现「总计 100 次但每天都是 0」
  const dayTotal = Object.values(base.days).reduce((acc, item) => acc + item, 0);
  if (dayTotal > base.total) base.total = dayTotal;

  return base;
}

export interface DailyPoint {
  date: string;
  /** 周几，如「一」 */
  label: string;
  /** 日期数字，如 20 */
  day: number;
  count: number;
  isToday: boolean;
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 最近 N 天（含今天）的每日次数 */
export function recentDaily(stats: CalcStats, now: number = Date.now(), days = 7): DailyPoint[] {
  const todayKey = dateKeyOf(now);
  const points: DailyPoint[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = addDaysToKey(todayKey, -index);
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(year, (month || 1) - 1, day || 1).getDay();
    points.push({
      date,
      label: WEEKDAY_LABELS[weekday] ?? '',
      day: day || 1,
      count: stats.days[date] ?? 0,
      isToday: date === todayKey,
    });
  }
  return points;
}

export interface CalcToolRow extends CalcToolMeta {
  count: number;
  lastAt: number | null;
  lastSummary: string;
  /** 占累计次数的百分比 */
  percent: number;
}

export interface CalcSummary {
  total: number;
  today: number;
  last7: number;
  /** 使用过的工具数 */
  activeTools: number;
  /** 连续使用天数 */
  streak: number;
  /** 相对上周同期的增幅（%），上周为 0 时返回 null */
  weekDelta: number | null;
  daily: DailyPoint[];
  tools: CalcToolRow[];
}

/** 连续天数：从今天或昨天往前推，遇到 0 就停 */
export function calcStreak(stats: CalcStats, now: number = Date.now()): number {
  const todayKey = dateKeyOf(now);
  const todayCount = stats.days[todayKey] ?? 0;
  let cursor = todayCount > 0 ? 0 : -1;
  let streak = 0;
  for (let guard = 0; guard < MAX_STREAK; guard += 1) {
    const key = addDaysToKey(todayKey, cursor);
    if ((stats.days[key] ?? 0) > 0) {
      streak += 1;
      cursor -= 1;
    } else {
      break;
    }
  }
  return streak;
}

export function summarizeCalcStats(stats: CalcStats, now: number = Date.now()): CalcSummary {
  const todayKey = dateKeyOf(now);
  const daily = recentDaily(stats, now, 7);

  let last7 = 0;
  for (let index = 0; index < 7; index += 1) {
    last7 += stats.days[addDaysToKey(todayKey, -index)] ?? 0;
  }

  let prev7 = 0;
  for (let index = 7; index < 14; index += 1) {
    prev7 += stats.days[addDaysToKey(todayKey, -index)] ?? 0;
  }

  const tools: CalcToolRow[] = CALC_TOOLS.map((meta) => {
    const stat = stats.tools[meta.key] ?? { count: 0, lastAt: null, lastSummary: '' };
    return {
      ...meta,
      count: stat.count,
      lastAt: stat.lastAt,
      lastSummary: stat.lastSummary,
      percent: stats.total > 0 ? Math.round((stat.count / stats.total) * 100) : 0,
    };
  });

  return {
    total: stats.total,
    today: stats.days[todayKey] ?? 0,
    last7,
    activeTools: tools.filter((item) => item.count > 0).length,
    streak: calcStreak(stats, now),
    weekDelta: prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null,
    daily,
    tools,
  };
}

/** 最近使用时间的中文描述：今天 15:20 / 昨天 09:12 / 10-18 */
export function fmtLastUsed(lastAt: number | null, now: number = Date.now()): string {
  if (!lastAt) return '还没用过';
  const todayKey = dateKeyOf(now);
  const targetKey = dateKeyOf(lastAt);
  const date = new Date(lastAt);
  const time = `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
  if (targetKey === todayKey) return `今天 ${time}`;
  if (targetKey === addDaysToKey(todayKey, -1)) return `昨天 ${time}`;
  const [year, month, day] = targetKey.split('-');
  if (year === todayKey.slice(0, 4)) return `${month}-${day}`;
  return `${year}-${month}-${day}`;
}

/** 按次数降序；次数相同按最近使用时间降序 */
export function sortToolRows(rows: CalcToolRow[]): CalcToolRow[] {
  return [...rows].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (b.lastAt ?? 0) - (a.lastAt ?? 0);
  });
}
