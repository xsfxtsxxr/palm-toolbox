/**
 * 待办清单数据模型与统计工具
 *
 * 记录结构：{ id, content, date, time, priority, category, completed, completedAt, createdAt }
 * 日期为本地时区的 YYYY-MM-DD，time 为 HH:mm 或空串（表示只定日期不定时间）。
 */

export type TodoPriority = 'high' | 'medium' | 'low';
export type TodoCategoryId = 'work' | 'life' | 'study' | 'shopping';
/** 顶部筛选 Tab */
export type TodoFilter = 'all' | 'today' | 'important' | 'done';

export interface Todo {
  id: string;
  content: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm，空串表示未设置时间 */
  time: string;
  priority: TodoPriority;
  /** 可选分类标签 */
  category: TodoCategoryId | null;
  completed: boolean;
  /** 完成时间戳（毫秒），未完成为 null */
  completedAt: number | null;
  createdAt: number;
}

/** 新建 / 编辑时提交的字段 */
export interface TodoDraft {
  content: string;
  date: string;
  time: string;
  priority: TodoPriority;
  category: TodoCategoryId | null;
}

/** 内容长度上限 */
export const MAX_CONTENT = 60;

export const PRIORITIES: { id: TodoPriority; label: string; color: string; bg: string; rank: number }[] = [
  { id: 'high', label: '重要', color: '#F05252', bg: '#FFE9E9', rank: 0 },
  { id: 'medium', label: '一般', color: '#F5A623', bg: '#FFF4E3', rank: 1 },
  { id: 'low', label: '随意', color: '#35B96E', bg: '#E4F7EC', rank: 2 },
];

export const TODO_CATEGORIES: {
  id: TodoCategoryId;
  label: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  { id: 'work', label: '工作', icon: '💼', color: '#3E7BFA', bg: '#E3EEFF' },
  { id: 'life', label: '生活', icon: '🏠', color: '#35B96E', bg: '#E4F7EC' },
  { id: 'study', label: '学习', icon: '📚', color: '#8B6FF0', bg: '#F0EBFF' },
  { id: 'shopping', label: '购物', icon: '🛒', color: '#F59E2C', bg: '#FFF1E0' },
];

export const FILTERS: { key: TodoFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今天' },
  { key: 'important', label: '重要' },
  { key: 'done', label: '已完成' },
];

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const WEEKDAY_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

const pad2 = (value: number) => String(value).padStart(2, '0');

/* ---------------- 日期工具 ---------------- */

/** Date -> 'YYYY-MM-DD' */
export function isoOfDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 时间戳 -> 'YYYY-MM-DD' */
export function isoOfTime(timestamp: number): string {
  return isoOfDate(new Date(timestamp));
}

export function todayISO(now = new Date()): string {
  return isoOfDate(now);
}

/** 'YYYY-MM-DD' -> Date（本地零点） */
export function parseISO(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** 日期加减天数 */
export function addDays(date: string, delta: number): string {
  const base = parseISO(date);
  base.setDate(base.getDate() + delta);
  return isoOfDate(base);
}

/** to - from 的天数差 */
export function diffDays(from: string, to: string): number {
  const a = parseISO(from);
  const b = parseISO(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** 周几（0 = 周一 … 6 = 周日） */
export function weekdayIndex(date: string): number {
  return (parseISO(date).getDay() + 6) % 7;
}

/** 'YYYY-MM-DD' -> '周二' */
export function weekdayCN(date: string): string {
  return WEEKDAYS[weekdayIndex(date)];
}

/** 'YYYY-MM-DD' -> '10月20日' */
export function formatDateCN(date: string): string {
  const [, month, day] = date.split('-').map(Number);
  return `${month}月${day}日`;
}

/** 本周一 */
export function startOfWeek(date: string): string {
  return addDays(date, -weekdayIndex(date));
}

/** 相对日期标签：今天 / 明天 / 昨天 / 10月22日 周四 */
export function formatDateLabel(date: string, today = todayISO()): string {
  const delta = diffDays(today, date);
  if (delta === 0) return '今天';
  if (delta === 1) return '明天';
  if (delta === 2) return '后天';
  if (delta === -1) return '昨天';
  return `${formatDateCN(date)} ${weekdayCN(date)}`;
}

/* ---------------- 记录构造 ---------------- */

export function priorityOf(id: TodoPriority) {
  return PRIORITIES.find((item) => item.id === id) ?? PRIORITIES[1];
}

export function categoryOfTodo(id: TodoCategoryId | null) {
  if (!id) return null;
  return TODO_CATEGORIES.find((item) => item.id === id) ?? null;
}

/** 校验内容，返回错误提示；合法返回 null */
export function validateContent(content: string): string | null {
  const text = content.trim();
  if (!text) return '请输入待办内容';
  if (text.length > MAX_CONTENT) return `内容不能超过 ${MAX_CONTENT} 个字`;
  return null;
}

export function createTodo(draft: TodoDraft, now = Date.now()): Todo {
  return {
    id: `todo-${now}-${Math.random().toString(36).slice(2, 8)}`,
    content: draft.content.trim().slice(0, MAX_CONTENT),
    date: draft.date,
    time: draft.time,
    priority: draft.priority,
    category: draft.category,
    completed: false,
    completedAt: null,
    createdAt: now,
  };
}

export function applyTodoDraft(todo: Todo, draft: TodoDraft): Todo {
  return {
    ...todo,
    content: draft.content.trim().slice(0, MAX_CONTENT),
    date: draft.date,
    time: draft.time,
    priority: draft.priority,
    category: draft.category,
  };
}

/** 已过期：截止日期早于今天且未完成 */
export function isOverdue(todo: Todo, today = todayISO()): boolean {
  return !todo.completed && todo.date < today;
}

/* ---------------- 排序 / 筛选 / 分组 ---------------- */

const timeRank = (time: string) => (time ? time : '99:99');

/** 未完成：日期升序 → 时间升序（无时间靠后）→ 优先级 → 创建时间 */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.time !== b.time) return timeRank(a.time) < timeRank(b.time) ? -1 : 1;
    const rankA = priorityOf(a.priority).rank;
    const rankB = priorityOf(b.priority).rank;
    if (rankA !== rankB) return rankA - rankB;
    return a.createdAt - b.createdAt;
  });
}

/** 已完成：按完成时间倒序 */
export function sortCompleted(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
}

export function filterTodos(todos: Todo[], filter: TodoFilter, today = todayISO()): Todo[] {
  switch (filter) {
    case 'today':
      return sortTodos(todos.filter((todo) => !todo.completed && todo.date === today));
    case 'important':
      return sortTodos(todos.filter((todo) => !todo.completed && todo.priority === 'high'));
    case 'done':
      return sortCompleted(todos.filter((todo) => todo.completed));
    default:
      return sortTodos(todos.filter((todo) => !todo.completed));
  }
}

export interface TodoGroup {
  key: string;
  label: string;
  todos: Todo[];
}

/** 未完成待办分组：已过期 / 今天 / 明天 / 本周内 / 以后 */
export function groupTodos(todos: Todo[], today = todayISO()): TodoGroup[] {
  const sorted = sortTodos(todos.filter((todo) => !todo.completed));
  const weekEnd = addDays(startOfWeek(today), 6);
  const buckets: TodoGroup[] = [
    { key: 'overdue', label: '已过期', todos: [] },
    { key: 'today', label: '今天', todos: [] },
    { key: 'tomorrow', label: '明天', todos: [] },
    { key: 'week', label: '本周内', todos: [] },
    { key: 'later', label: '以后', todos: [] },
  ];

  sorted.forEach((todo) => {
    if (todo.date < today) buckets[0].todos.push(todo);
    else if (todo.date === today) buckets[1].todos.push(todo);
    else if (todo.date === addDays(today, 1)) buckets[2].todos.push(todo);
    else if (todo.date <= weekEnd) buckets[3].todos.push(todo);
    else buckets[4].todos.push(todo);
  });

  return buckets.filter((bucket) => bucket.todos.length > 0);
}

/** 已完成分组：今天完成 / 昨天完成 / 更早 */
export function groupCompleted(todos: Todo[], today = todayISO()): TodoGroup[] {
  const sorted = sortCompleted(todos.filter((todo) => todo.completed));
  const yesterday = addDays(today, -1);
  const buckets: TodoGroup[] = [
    { key: 'today', label: '今天完成', todos: [] },
    { key: 'yesterday', label: '昨天完成', todos: [] },
    { key: 'earlier', label: '更早完成', todos: [] },
  ];

  sorted.forEach((todo) => {
    const day = todo.completedAt ? isoOfTime(todo.completedAt) : '';
    if (day === today) buckets[0].todos.push(todo);
    else if (day === yesterday) buckets[1].todos.push(todo);
    else buckets[2].todos.push(todo);
  });

  return buckets.filter((bucket) => bucket.todos.length > 0);
}

/* ---------------- 统计 ---------------- */

export interface TodoDailyPoint {
  date: string;
  label: string;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface TodoCategoryStat {
  id: TodoCategoryId;
  label: string;
  icon: string;
  color: string;
  done: number;
}

export interface TodoStats {
  /** 累计完成 */
  totalDone: number;
  /** 本周完成（周一至周日） */
  weekDone: number;
  /** 连续打卡天数 */
  streak: number;
  /** 待处理 */
  pending: number;
  /** 已过期未完成 */
  overdue: number;
  /** 本周每日完成数（周一 → 周日） */
  daily: TodoDailyPoint[];
  /** 已完成按分类分布（降序，仅含有数据的分类） */
  byCategory: TodoCategoryStat[];
}

/** 连续打卡：从今天（今天为空则从昨天）向前数连续有完成记录的天数 */
export function completionStreak(todos: Todo[], today = todayISO()): number {
  const days = new Set(
    todos
      .filter((todo) => todo.completed && todo.completedAt)
      .map((todo) => isoOfTime(todo.completedAt as number)),
  );

  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function todoStats(todos: Todo[], today = todayISO()): TodoStats {
  const completed = todos.filter((todo) => todo.completed);
  const pending = todos.length - completed.length;
  const weekStart = startOfWeek(today);

  const daily: TodoDailyPoint[] = WEEKDAY_SHORT.map((label, index) => {
    const date = addDays(weekStart, index);
    const count = completed.filter(
      (todo) => todo.completedAt && isoOfTime(todo.completedAt) === date,
    ).length;
    return { date, label, count, isToday: date === today, isFuture: date > today };
  });

  const weekDone = daily.reduce((sum, point) => sum + point.count, 0);

  const byCategory = TODO_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    icon: category.icon,
    color: category.color,
    done: completed.filter((todo) => todo.category === category.id).length,
  }))
    .filter((item) => item.done > 0)
    .sort((a, b) => b.done - a.done);

  return {
    totalDone: completed.length,
    weekDone,
    streak: completionStreak(todos, today),
    pending,
    overdue: todos.filter((todo) => isOverdue(todo, today)).length,
    daily,
    byCategory,
  };
}

/* ---------------- 智能识别（快捷添加） ---------------- */

export interface QuickParseResult {
  content: string;
  date: string;
  time: string;
  priority: TodoPriority;
  /** 是否识别到日期 */
  dateMatched: boolean;
  /** 是否识别到时间 */
  timeMatched: boolean;
}

const WEEKDAY_TOKEN: Record<string, number> = {
  一: 0,
  二: 1,
  三: 2,
  四: 3,
  五: 4,
  六: 5,
  日: 6,
  天: 6,
};

const normalizeHour = (hour: number, period?: string) => {
  if (!period) return Math.min(hour, 23);
  if (period === '下午' || period === '傍晚' || period === '晚上') {
    return hour < 12 ? hour + 12 : hour;
  }
  if (period === '中午') return hour < 12 ? hour + 12 : hour;
  if (period === '凌晨') return hour === 12 ? 0 : hour;
  return hour;
};

const cleanContent = (text: string) =>
  text
    .replace(/^[\s,，。、·:：;；\-—_]+/, '')
    .replace(/[\s,，。、·:：;；\-—_]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/**
 * 解析快捷输入，如「明天下午3点开会」→ { content: '开会', date: 明天, time: '15:00' }
 * 识别项：今天/明天/后天/大后天、周X/星期X/礼拜X（含下周）、X月X日、YYYY-MM-DD、
 * 上午/下午/晚上/中午 + X点(X半)、HH:mm，以及句首的「重要 / 紧急 / 随意」。
 */
export function parseQuickInput(text: string, today = todayISO()): QuickParseResult {
  let rest = text.trim();
  let date = today;
  let time = '';
  let priority: TodoPriority = 'medium';
  let dateMatched = false;
  let timeMatched = false;

  // 优先级（句首）
  const priorityMatch = rest.match(/^(!!|！！|重要|紧急|急|随意|不急)\s*/);
  if (priorityMatch) {
    priority = ['随意', '不急'].includes(priorityMatch[1]) ? 'low' : 'high';
    rest = rest.slice(priorityMatch[0].length);
  }

  // 完整日期 2026-10-20 / 2026/10/20
  const fullDate = rest.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (fullDate) {
    date = `${fullDate[1]}-${pad2(Number(fullDate[2]))}-${pad2(Number(fullDate[3]))}`;
    dateMatched = true;
    rest = rest.replace(fullDate[0], ' ');
  }

  // X月X日
  if (!dateMatched) {
    const monthDay = rest.match(/(\d{1,2})月(\d{1,2})[日号]/);
    if (monthDay) {
      const year = Number(today.slice(0, 4));
      date = `${year}-${pad2(Number(monthDay[1]))}-${pad2(Number(monthDay[2]))}`;
      dateMatched = true;
      rest = rest.replace(monthDay[0], ' ');
    }
  }

  // 周X / 星期X / 礼拜X（可带「下」）
  if (!dateMatched) {
    const weekday = rest.match(/(下下|下)?(?:周|星期|礼拜)([一二三四五六日天])/);
    if (weekday) {
      const target = WEEKDAY_TOKEN[weekday[2]];
      if (weekday[1] === '下') {
        // 「下周一」= 下周一的日期
        date = addDays(startOfWeek(today), 7 + target);
      } else if (weekday[1] === '下下') {
        date = addDays(startOfWeek(today), 14 + target);
      } else {
        date = addDays(today, (target - weekdayIndex(today) + 7) % 7);
      }
      dateMatched = true;
      rest = rest.replace(weekday[0], ' ');
    }
  }

  // 今天 / 明天 / 后天 / 大后天
  if (!dateMatched) {
    const relative = rest.match(/(大后天|后天|明天|明日|今天|今日)/);
    if (relative) {
      const map: Record<string, number> = {
        今天: 0,
        今日: 0,
        明天: 1,
        明日: 1,
        后天: 2,
        大后天: 3,
      };
      date = addDays(today, map[relative[1]] ?? 0);
      dateMatched = true;
      rest = rest.replace(relative[0], ' ');
    }
  }

  // HH:mm
  const clock = rest.match(/(\d{1,2}):(\d{2})/);
  if (clock) {
    const hour = Number(clock[1]);
    const minute = Number(clock[2]);
    if (hour <= 23 && minute <= 59) {
      time = `${pad2(hour)}:${pad2(minute)}`;
      timeMatched = true;
      rest = rest.replace(clock[0], ' ');
    }
  }

  // X点 / X点半 / X点X分（可带时段）
  if (!timeMatched) {
    const dot = rest.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上)?\s*(\d{1,2})\s*[点时](半|\d{1,2}\s*分?)?/);
    if (dot) {
      const hour = normalizeHour(Number(dot[2]), dot[1]);
      const rawMinute = dot[3]?.replace(/\s|分/g, '');
      const minute = rawMinute === '半' ? 30 : rawMinute ? Number(rawMinute) : 0;
      if (hour <= 23 && minute <= 59) {
        time = `${pad2(hour)}:${pad2(minute)}`;
        timeMatched = true;
        rest = rest.replace(dot[0], ' ');
      }
    }
  }

  return {
    content: cleanContent(rest),
    date,
    time,
    priority,
    dateMatched,
    timeMatched,
  };
}
