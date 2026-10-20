/**
 * 待办清单引擎单元测试
 * 固定「今天」为 2026-10-20（周二），保证结果与运行环境无关
 */
import {
  addDays,
  applyTodoDraft,
  completionStreak,
  createTodo,
  diffDays,
  filterTodos,
  formatDateLabel,
  groupCompleted,
  groupTodos,
  isOverdue,
  parseQuickInput,
  sortCompleted,
  sortTodos,
  startOfWeek,
  todoStats,
  validateContent,
  weekdayCN,
  type Todo,
} from './todo';

const TODAY = '2026-10-20';

const at = (date: string, hour = 12, minute = 0) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
};

const todo = (patch: Partial<Todo> & { id: string }): Todo => ({
  content: patch.content ?? `任务 ${patch.id}`,
  date: patch.date ?? TODAY,
  time: patch.time ?? '',
  priority: patch.priority ?? 'medium',
  category: patch.category ?? null,
  completed: patch.completed ?? false,
  completedAt: patch.completedAt ?? null,
  createdAt: patch.createdAt ?? 0,
  ...patch,
});

describe('日期工具', () => {
  it('换算日期加减与天数差', () => {
    expect(addDays(TODAY, 1)).toBe('2026-10-21');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays(TODAY, -20)).toBe('2026-09-30');
    expect(diffDays(TODAY, '2026-10-25')).toBe(5);
    expect(diffDays(TODAY, '2026-10-19')).toBe(-1);
  });

  it('识别周几与本周一', () => {
    expect(weekdayCN(TODAY)).toBe('周二');
    expect(weekdayCN('2026-10-19')).toBe('周一');
    expect(weekdayCN('2026-10-25')).toBe('周日');
    expect(startOfWeek(TODAY)).toBe('2026-10-19');
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19');
  });

  it('相对日期标签', () => {
    expect(formatDateLabel(TODAY, TODAY)).toBe('今天');
    expect(formatDateLabel('2026-10-21', TODAY)).toBe('明天');
    expect(formatDateLabel('2026-10-22', TODAY)).toBe('后天');
    expect(formatDateLabel('2026-10-19', TODAY)).toBe('昨天');
    expect(formatDateLabel('2026-11-02', TODAY)).toBe('11月2日 周一');
  });
});

describe('记录构造与校验', () => {
  it('新建待办默认未完成', () => {
    const created = createTodo(
      { content: '  买菜  ', date: TODAY, time: '14:00', priority: 'high', category: 'life' },
      at(TODAY),
    );
    expect(created.content).toBe('买菜');
    expect(created.completed).toBe(false);
    expect(created.completedAt).toBeNull();
    expect(created.priority).toBe('high');
    expect(created.category).toBe('life');
  });

  it('编辑保留完成状态与创建时间', () => {
    const base = todo({ id: 'a', completed: true, completedAt: at(TODAY, 9) });
    const next = applyTodoDraft(base, {
      content: '交电费',
      date: '2026-10-22',
      time: '',
      priority: 'low',
      category: 'life',
    });
    expect(next.content).toBe('交电费');
    expect(next.date).toBe('2026-10-22');
    expect(next.completed).toBe(true);
    expect(next.completedAt).toBe(base.completedAt);
  });

  it('内容校验', () => {
    expect(validateContent('  ')).toBe('请输入待办内容');
    expect(validateContent('a'.repeat(61))).toBe('内容不能超过 60 个字');
    expect(validateContent('买菜')).toBeNull();
  });

  it('过期判定只针对未完成且日期早于今天', () => {
    expect(isOverdue(todo({ id: 'a', date: '2026-10-19' }), TODAY)).toBe(true);
    expect(isOverdue(todo({ id: 'b', date: TODAY }), TODAY)).toBe(false);
    expect(isOverdue(todo({ id: 'c', date: '2026-10-19', completed: true }), TODAY)).toBe(false);
  });
});

describe('排序与筛选', () => {
  const list = [
    todo({ id: 'late', date: '2026-10-22', priority: 'high' }),
    todo({ id: 'todayNoTime', date: TODAY }),
    todo({ id: 'todayMorning', date: TODAY, time: '09:00', priority: 'low' }),
    todo({ id: 'todayEvening', date: TODAY, time: '20:00', priority: 'high' }),
    todo({ id: 'done', date: TODAY, completed: true, completedAt: at(TODAY, 8) }),
  ];

  it('按日期、时间（无时间靠后）、优先级排序', () => {
    expect(sortTodos(list).map((item) => item.id)).toEqual([
      'todayMorning',
      'todayEvening',
      'todayNoTime',
      'done',
      'late',
    ]);
    // 未完成场景下（组件实际使用方式）
    expect(sortTodos(list.filter((item) => !item.completed)).map((item) => item.id)).toEqual([
      'todayMorning',
      'todayEvening',
      'todayNoTime',
      'late',
    ]);
  });

  it('已完成按完成时间倒序', () => {
    const done = [
      todo({ id: 'old', completed: true, completedAt: at(TODAY, 8) }),
      todo({ id: 'new', completed: true, completedAt: at(TODAY, 18) }),
    ];
    expect(sortCompleted(done).map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('四个筛选 Tab 的结果', () => {
    expect(filterTodos(list, 'all', TODAY).map((item) => item.id)).toEqual([
      'todayMorning',
      'todayEvening',
      'todayNoTime',
      'late',
    ]);
    expect(filterTodos(list, 'today', TODAY).map((item) => item.id)).toEqual([
      'todayMorning',
      'todayEvening',
      'todayNoTime',
    ]);
    expect(filterTodos(list, 'important', TODAY).map((item) => item.id)).toEqual([
      'todayEvening',
      'late',
    ]);
    expect(filterTodos(list, 'done', TODAY).map((item) => item.id)).toEqual(['done']);
  });
});

describe('分组', () => {
  it('未完成按时间远近分组', () => {
    const groups = groupTodos(
      [
        todo({ id: 'overdue', date: '2026-10-18' }),
        todo({ id: 'today', date: TODAY }),
        todo({ id: 'tomorrow', date: '2026-10-21' }),
        todo({ id: 'week', date: '2026-10-23' }),
        todo({ id: 'later', date: '2026-11-05' }),
        todo({ id: 'done', date: '2026-10-18', completed: true, completedAt: at(TODAY) }),
      ],
      TODAY,
    );

    expect(groups.map((group) => group.label)).toEqual(['已过期', '今天', '明天', '本周内', '以后']);
    expect(groups.map((group) => group.todos.length)).toEqual([1, 1, 1, 1, 1]);
  });

  it('已完成按完成日期分组', () => {
    const groups = groupCompleted(
      [
        todo({ id: 'today', completed: true, completedAt: at(TODAY, 9) }),
        todo({ id: 'yesterday', completed: true, completedAt: at('2026-10-19', 9) }),
        todo({ id: 'earlier', completed: true, completedAt: at('2026-10-10', 9) }),
      ],
      TODAY,
    );

    expect(groups.map((group) => group.label)).toEqual(['今天完成', '昨天完成', '更早完成']);
  });

  it('空分组不返回', () => {
    expect(groupTodos([todo({ id: 'a', date: TODAY })], TODAY).map((g) => g.key)).toEqual(['today']);
  });
});

describe('统计', () => {
  const list = [
    todo({ id: 'p1', date: TODAY }),
    todo({ id: 'p2', date: '2026-10-18', priority: 'high' }),
    todo({ id: 'd1', date: TODAY, completed: true, completedAt: at(TODAY, 10), category: 'work' }),
    todo({ id: 'd2', date: '2026-10-19', completed: true, completedAt: at('2026-10-19', 9), category: 'work' }),
    todo({ id: 'd3', date: '2026-10-19', completed: true, completedAt: at('2026-10-18', 9), category: 'life' }),
  ];

  it('汇总完成数、待处理与过期数', () => {
    const stats = todoStats(list, TODAY);
    expect(stats.totalDone).toBe(3);
    expect(stats.pending).toBe(2);
    expect(stats.overdue).toBe(1);
  });

  it('本周完成数与每日分布', () => {
    const stats = todoStats(list, TODAY);
    expect(stats.weekDone).toBe(2);
    expect(stats.daily.map((point) => point.count)).toEqual([1, 1, 0, 0, 0, 0, 0]);
    expect(stats.daily[1].isToday).toBe(true);
    expect(stats.daily[0].label).toBe('一');
  });

  it('连续打卡从今天向前数', () => {
    expect(completionStreak(list, TODAY)).toBe(3);
    // 今天没有完成记录时，从昨天开始数
    expect(completionStreak(list.filter((item) => item.id !== 'd1'), TODAY)).toBe(2);
    expect(completionStreak([], TODAY)).toBe(0);
  });

  it('按分类统计已完成', () => {
    const stats = todoStats(list, TODAY);
    expect(stats.byCategory.map((item) => [item.id, item.done])).toEqual([
      ['work', 2],
      ['life', 1],
    ]);
  });
});

describe('快捷输入智能识别', () => {
  it('只有内容时默认今天、无时间、一般优先级', () => {
    const parsed = parseQuickInput('买菜', TODAY);
    expect(parsed).toMatchObject({
      content: '买菜',
      date: TODAY,
      time: '',
      priority: 'medium',
      dateMatched: false,
    });
  });

  it('识别相对日期 + 下午时间', () => {
    const parsed = parseQuickInput('明天下午3点开会', TODAY);
    expect(parsed.content).toBe('开会');
    expect(parsed.date).toBe('2026-10-21');
    expect(parsed.time).toBe('15:00');
  });

  it('识别周几与 24 小时制时间', () => {
    const parsed = parseQuickInput('周五 17:00 写周报', TODAY);
    expect(parsed.content).toBe('写周报');
    expect(parsed.date).toBe('2026-10-23');
    expect(parsed.time).toBe('17:00');
  });

  it('识别下周、月日与「点半」', () => {
    expect(parseQuickInput('下周一 提交方案', TODAY).date).toBe('2026-10-26');
    expect(parseQuickInput('10月25日 陪家人', TODAY).date).toBe('2026-10-25');
    const parsed = parseQuickInput('晚上8点半 追剧', TODAY);
    expect(parsed.time).toBe('20:30');
    expect(parsed.content).toBe('追剧');
  });

  it('识别句首优先级标记', () => {
    const important = parseQuickInput('重要 交电费', TODAY);
    expect(important.priority).toBe('high');
    expect(important.content).toBe('交电费');

    const flag = parseQuickInput('!! 交房租', TODAY);
    expect(flag.priority).toBe('high');
    expect(flag.content).toBe('交房租');

    expect(parseQuickInput('随意 看看书', TODAY).priority).toBe('low');
  });

  it('识别完整日期与冒号时间', () => {
    const parsed = parseQuickInput('2026-11-11 09:30 抢购', TODAY);
    expect(parsed.date).toBe('2026-11-11');
    expect(parsed.time).toBe('09:30');
    expect(parsed.content).toBe('抢购');
  });
});
