/**
 * 计算次数上下文：全局累计次数 + 分工具次数，异步持久化到 AsyncStorage
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createEmptyStats,
  recordCalc,
  summarizeCalcStats,
  type CalcKind,
  type CalcStats,
  type CalcSummary,
} from '../utils/calcStats';
import { clearCalcStats, readCalcStats, writeCalcStats } from '../utils/calcStatsStorage';

interface CalcStatsContextValue {
  stats: CalcStats;
  summary: CalcSummary;
  /** 是否已从本地读取完成 */
  ready: boolean;
  /** 记一次计算；summary 为参数摘要，如「100万 · 30年」 */
  record: (kind: CalcKind, summary?: string) => void;
  reset: () => void;
}

const CalcStatsContext = createContext<CalcStatsContextValue>({
  stats: createEmptyStats(),
  summary: summarizeCalcStats(createEmptyStats()),
  ready: false,
  record: () => {},
  reset: () => {},
});

export const CalcStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<CalcStats>(createEmptyStats);
  const [ready, setReady] = useState(false);

  // 初次读取本地记录
  useEffect(() => {
    let alive = true;
    readCalcStats()
      .then((local) => {
        if (!alive) return;
        setStats(local);
        setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const record = useCallback((kind: CalcKind, summary = '') => {
    setStats((prev) => recordCalc(prev, kind, summary));
  }, []);

  const reset = useCallback(() => {
    setStats(createEmptyStats());
    void clearCalcStats();
  }, []);

  // 变更后延迟写入，避免连续勾选时频繁落盘
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void writeCalcStats(stats);
    }, 400);
    return () => clearTimeout(timer);
  }, [stats, ready]);

  const summary = useMemo(() => summarizeCalcStats(stats), [stats]);

  const value = useMemo<CalcStatsContextValue>(
    () => ({ stats, summary, ready, record, reset }),
    [stats, summary, ready, record, reset],
  );

  return <CalcStatsContext.Provider value={value}>{children}</CalcStatsContext.Provider>;
};

export const useCalcStats = () => useContext(CalcStatsContext);
