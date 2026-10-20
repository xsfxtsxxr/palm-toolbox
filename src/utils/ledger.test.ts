/** 记账本数据与统计单元测试 */
import {
  MAX_AMOUNT,
  applyDraft,
  categoryBreakdown,
  createRecord,
  filterRecords,
  formatDateCN,
  formatMonthCN,
  groupByDate,
  monthKeyOf,
  monthlyTrend,
  nowTime,
  recentAmounts,
  recordsToCSV,
  shiftMonth,
  summarize,
  todayISO,
  validateAmount,
  weekdayCN,
  type LedgerRecord,
} from './ledger';

const NOW = new Date(2026, 9, 20, 14, 30);

const makeRecord = (overrides: Partial<LedgerRecord> = {}): LedgerRecord => ({
  id: 'r1',
  type: 'expense',
  amount: 35,
  category: 'food',
  categoryIcon: '🍔',
  date: '2026-10-20',
  time: '14:30',
  note: '午饭',
  createdAt: 1,
  ...overrides,
});

describe('日期工具', () => {
  it('本地日期与时间', () => {
    expect(todayISO(NOW)).toBe('2026-10-20');
    expect(nowTime(NOW)).toBe('14:30');
    expect(monthKeyOf('2026-10-20')).toBe('2026-10');
  });

  it('月份偏移跨年', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-10', -9)).toBe('2026-01');
  });

  it('中文日期 / 月份 / 星期', () => {
    expect(formatMonthCN('2026-10')).toBe('2026年10月');
    expect(formatDateCN('2026-10-20')).toBe('10月20日');
    expect(weekdayCN('2026-10-20')).toBe('周二');
    expect(weekdayCN('2026-10-18')).toBe('周日');
  });
});

describe('记录创建与编辑', () => {
  it('创建记录：四舍五入到分、补分类图标、去空格', () => {
    const record = createRecord(
      {
        type: 'expense',
        amount: 35.006,
        category: 'food',
        date: '2026-10-20',
        time: '14:30',
        note: '  午饭  ',
      },
      1760000000000,
    );
    expect(record.amount).toBe(35.01);
    expect(record.categoryIcon).toBe('🍔');
    expect(record.note).toBe('午饭');
    expect(record.id).toMatch(/^ledger-1760000000000-/);
    expect(record.createdAt).toBe(1760000000000);
  });

  it('编辑保留 id / 创建时间，更新类型与图标', () => {
    const record = makeRecord();
    const updated = applyDraft(record, {
      type: 'income',
      amount: 500,
      category: 'parttime',
      date: '2026-10-19',
      time: '10:00',
      note: '兼职',
    });
    expect(updated.id).toBe(record.id);
    expect(updated.createdAt).toBe(record.createdAt);
    expect(updated.type).toBe('income');
    expect(updated.categoryIcon).toBe('💼');
    expect(updated.amount).toBe(500);
  });
});

describe('筛选 / 汇总 / 分组', () => {
  const records = [
    makeRecord({ id: 'a', amount: 35, date: '2026-10-20', createdAt: 3 }),
    makeRecord({ id: 'b', type: 'income', amount: 500, category: 'parttime', date: '2026-10-20', createdAt: 2 }),
    makeRecord({ id: 'c', amount: 128, category: 'shopping', date: '2026-10-19', createdAt: 1 }),
    makeRecord({ id: 'd', amount: 12, category: 'transport', date: '2026-09-30', createdAt: 0 }),
  ];

  it('按月份与类型筛选，日期倒序', () => {
    const october = filterRecords(records, { month: '2026-10' });
    expect(october.map((item) => item.id)).toEqual(['a', 'b', 'c']);

    const expense = filterRecords(records, { month: '2026-10', type: 'expense' });
    expect(expense.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('汇总支出、收入与结余', () => {
    const summary = summarize(filterRecords(records, { month: '2026-10' }));
    expect(summary.expense).toBe(163);
    expect(summary.income).toBe(500);
    expect(summary.balance).toBe(337);
    expect(summary.count).toBe(3);
  });

  it('按日期分组并计算小计', () => {
    const groups = groupByDate(filterRecords(records, { month: '2026-10' }));
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ date: '2026-10-20', expense: 35, income: 500 });
    expect(groups[0].records).toHaveLength(2);
    expect(groups[1]).toMatchObject({ date: '2026-10-19', expense: 128, income: 0 });
  });
});

describe('分类占比与趋势', () => {
  const records = [
    makeRecord({ id: 'a', amount: 60, category: 'food' }),
    makeRecord({ id: 'b', amount: 30, category: 'transport' }),
    makeRecord({ id: 'c', amount: 10, category: 'other' }),
    makeRecord({ id: 'd', type: 'income', amount: 500, category: 'salary' }),
  ];

  it('支出分类按金额降序，占比合计约 100%', () => {
    const slices = categoryBreakdown(records);
    expect(slices.map((slice) => slice.name)).toEqual(['餐饮', '交通', '其他']);
    expect(slices.map((slice) => slice.percent)).toEqual([60, 30, 10]);
    expect(slices.reduce((sum, slice) => sum + slice.percent, 0)).toBeCloseTo(100, 6);
    expect(slices[0].color).toBe('#35B96E');
  });

  it('近 6 个月趋势按时间升序', () => {
    const trend = monthlyTrend(records, '2026-10');
    expect(trend).toHaveLength(6);
    expect(trend[0].month).toBe('2026-05');
    expect(trend[5].month).toBe('2026-10');
    expect(trend[5].expense).toBe(100);
    expect(trend[5].income).toBe(500);
    expect(trend[5].balance).toBe(400);
    expect(trend[0].expense).toBe(0);
  });

  it('最近金额去重并限制条数', () => {
    const list = [
      makeRecord({ id: 'a', amount: 35, createdAt: 4 }),
      makeRecord({ id: 'b', amount: 12, createdAt: 3 }),
      makeRecord({ id: 'c', amount: 35, createdAt: 2 }),
      makeRecord({ id: 'd', amount: 128, createdAt: 1 }),
    ];
    expect(recentAmounts(list)).toEqual([35, 12, 128]);
    expect(recentAmounts(list, 2)).toEqual([35, 12]);
  });
});

describe('CSV 导出', () => {
  it('按时间升序，转义逗号与引号', () => {
    const csv = recordsToCSV([
      makeRecord({ id: 'b', date: '2026-10-20', time: '14:30', note: '午饭,同事' }),
      makeRecord({
        id: 'a',
        date: '2026-10-19',
        time: '08:15',
        type: 'income',
        category: 'parttime',
        amount: 500,
        note: '他说"好"',
      }),
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('日期,时间,类型,分类,金额,备注');
    expect(lines[1]).toBe('2026-10-19,08:15,收入,兼职,500.00,"他说""好"""');
    expect(lines[2]).toBe('2026-10-20,14:30,支出,餐饮,35.00,"午饭,同事"');
  });
});

describe('金额校验', () => {
  it('必须大于 0 且不超过上限', () => {
    expect(validateAmount(0)).toBe('请输入大于 0 的金额');
    expect(validateAmount(Number.NaN)).toBe('请输入大于 0 的金额');
    expect(validateAmount(MAX_AMOUNT + 0.01)).toBe('单笔金额不能超过 999,999.99');
    expect(validateAmount(MAX_AMOUNT)).toBeNull();
    expect(validateAmount(35.5)).toBeNull();
  });
});
