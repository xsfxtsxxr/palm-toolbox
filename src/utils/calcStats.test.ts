import {
  CALC_TOOLS,
  calcStreak,
  createEmptyStats,
  dateKeyOf,
  fmtLastUsed,
  normalizeCalcStats,
  recentDaily,
  recordCalc,
  sortToolRows,
  summarizeCalcStats,
} from './calcStats';

/** 2026-10-20 15:00（本地时区） */
const NOW = new Date(2026, 9, 20, 15, 0, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;

const at = (daysAgo: number, hour = 10) =>
  new Date(2026, 9, 20 - daysAgo, hour, 0, 0).getTime();

describe('calcStats 数据结构', () => {
  it('空数据包含全部工具且计数为 0', () => {
    const stats = createEmptyStats();
    expect(stats.total).toBe(0);
    expect(Object.keys(stats.tools)).toHaveLength(CALC_TOOLS.length);
    expect(stats.tools.mortgage.count).toBe(0);
    expect(stats.days).toEqual({});
  });

  it('dateKeyOf 使用本地时区', () => {
    expect(dateKeyOf(NOW)).toBe('2026-10-20');
    expect(dateKeyOf(new Date(2026, 0, 5, 23, 30).getTime())).toBe('2026-01-05');
  });
});

describe('recordCalc', () => {
  it('累加总数、工具次数与每日次数', () => {
    let stats = createEmptyStats();
    stats = recordCalc(stats, 'mortgage', '剩余本金 100 万', at(0));
    stats = recordCalc(stats, 'mortgage', '剩余本金 120 万', at(0, 11));

    expect(stats.total).toBe(2);
    expect(stats.tools.mortgage.count).toBe(2);
    expect(stats.tools.mortgage.lastSummary).toBe('剩余本金 120 万');
    expect(stats.tools.mortgage.lastAt).toBe(at(0, 11));
    expect(stats.days['2026-10-20']).toBe(2);
  });

  it('不改变原始对象（纯函数）', () => {
    const base = createEmptyStats();
    const next = recordCalc(base, 'tax', '月薪 ¥20000', at(2));
    expect(base.total).toBe(0);
    expect(next.total).toBe(1);
  });

  it('空摘要不会覆盖上一次的摘要', () => {
    let stats = createEmptyStats();
    stats = recordCalc(stats, 'deposit', '本金 ¥100000', at(1));
    stats = recordCalc(stats, 'deposit', '', at(0));
    expect(stats.tools.deposit.lastSummary).toBe('本金 ¥100000');
  });
});

describe('recentDaily', () => {
  it('返回最近 7 天，最后一天是今天', () => {
    const stats = recordCalc(createEmptyStats(), 'unit', '1 cm → in', at(0));
    const daily = recentDaily(stats, NOW, 7);

    expect(daily).toHaveLength(7);
    expect(daily[6].isToday).toBe(true);
    expect(daily[6].date).toBe('2026-10-20');
    expect(daily[6].count).toBe(1);
    expect(daily[0].date).toBe('2026-10-14');
    expect(daily.filter((point) => point.isToday)).toHaveLength(1);
  });

  it('周几标签正确（2026-10-20 是周二）', () => {
    const daily = recentDaily(createEmptyStats(), NOW, 7);
    expect(daily[6].label).toBe('二');
  });
});

describe('calcStreak', () => {
  const buildStats = (daysAgoList: number[]) => {
    let stats = createEmptyStats();
    for (const daysAgo of daysAgoList) {
      stats = recordCalc(stats, 'currency', '100 CNY → USD', at(daysAgo));
    }
    return stats;
  };

  it('今天起连续 3 天', () => {
    expect(calcStreak(buildStats([0, 1, 2]), NOW)).toBe(3);
  });

  it('今天没算、昨天算了，连续天数从昨天算起', () => {
    expect(calcStreak(buildStats([1, 2]), NOW)).toBe(2);
  });

  it('中间断档则只算到断点', () => {
    expect(calcStreak(buildStats([0, 1, 3]), NOW)).toBe(2);
  });

  it('完全没有记录时为 0', () => {
    expect(calcStreak(createEmptyStats(), NOW)).toBe(0);
  });
});

describe('summarizeCalcStats', () => {
  const build = () => {
    let stats = createEmptyStats();
    stats = recordCalc(stats, 'mortgage', '', at(0));
    stats = recordCalc(stats, 'mortgage', '', at(0, 9));
    stats = recordCalc(stats, 'tax', '', at(2));
    stats = recordCalc(stats, 'unit', '', at(9));
    return stats;
  };

  it('汇总今日 / 近 7 天 / 用过的工具数', () => {
    const summary = summarizeCalcStats(build(), NOW);
    expect(summary.total).toBe(4);
    expect(summary.today).toBe(2);
    expect(summary.last7).toBe(3);
    expect(summary.activeTools).toBe(3);
  });

  it('上周同期有数据时给出环比', () => {
    const summary = summarizeCalcStats(build(), NOW);
    // 上周同期 1 次，本周 3 次 → +200%
    expect(summary.weekDelta).toBe(200);
  });

  it('上周没有数据时环比为 null', () => {
    let stats = createEmptyStats();
    stats = recordCalc(stats, 'tax', '', at(0));
    expect(summarizeCalcStats(stats, NOW).weekDelta).toBeNull();
  });

  it('工具占比按累计次数计算', () => {
    const summary = summarizeCalcStats(build(), NOW);
    const mortgage = summary.tools.find((item) => item.key === 'mortgage');
    expect(mortgage?.percent).toBe(50);
    expect(mortgage?.count).toBe(2);
  });
});

describe('normalizeCalcStats', () => {
  it('丢弃脏数据并从明细修正总数', () => {
    const stats = normalizeCalcStats({
      total: 1,
      tools: { mortgage: { count: 3, lastAt: 'bad', lastSummary: 123 }, unknown: {} },
      days: { '2026-10-20': 2, '2026-10-19': 'x', bad: 5 },
      updatedAt: 'nope',
    });

    expect(stats.tools.mortgage.count).toBe(3);
    expect(stats.tools.mortgage.lastAt).toBeNull();
    expect(stats.tools.mortgage.lastSummary).toBe('');
    expect(stats.days).toEqual({ '2026-10-20': 2 });
    // 明细合计 2 > 原 total 1，取明细
    expect(stats.total).toBe(2);
    expect(stats.updatedAt).toBe(0);
  });

  it('非法输入返回空结构', () => {
    expect(normalizeCalcStats(null).total).toBe(0);
    expect(normalizeCalcStats('x').tools.mortgage.count).toBe(0);
  });
});

describe('sortToolRows 与时间文案', () => {
  it('按次数降序，次数相同按最近使用', () => {
    const summary = summarizeCalcStats(
      (() => {
        let stats = createEmptyStats();
        stats = recordCalc(stats, 'tax', '', at(1));
        stats = recordCalc(stats, 'unit', '', at(0));
        stats = recordCalc(stats, 'unit', '', at(0, 12));
        return stats;
      })(),
      NOW,
    );
    const sorted = sortToolRows(summary.tools).filter((row) => row.count > 0);
    expect(sorted.map((row) => row.key)).toEqual(['unit', 'tax']);
  });

  it('最近使用时间文案', () => {
    expect(fmtLastUsed(null, NOW)).toBe('还没用过');
    expect(fmtLastUsed(at(0, 9), NOW)).toBe('今天 09:00');
    expect(fmtLastUsed(at(1, 8), NOW)).toBe('昨天 08:00');
    expect(fmtLastUsed(at(0) - 3 * DAY, NOW)).toBe('10-17');
  });
});
