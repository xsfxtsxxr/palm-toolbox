/**
 * 计算记录上下文：保存房贷计算历史（内存态，最多 20 条）
 * 统计页与「我的」页消费此数据
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { MortgageResult } from '../types';

interface CalculationContextValue {
  history: MortgageResult[];
  latest: MortgageResult | null;
  totalCount: number;
  totalSavedInterest: number;
  addResult: (result: MortgageResult) => void;
}

const CalculationContext = createContext<CalculationContextValue>({
  history: [],
  latest: null,
  totalCount: 0,
  totalSavedInterest: 0,
  addResult: () => {},
});

const MAX_HISTORY = 20;

export const CalculationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<MortgageResult[]>([]);

  const addResult = useCallback((result: MortgageResult) => {
    setHistory((prev) => [result, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const value = useMemo<CalculationContextValue>(
    () => ({
      history,
      latest: history[0] ?? null,
      totalCount: history.length,
      totalSavedInterest: history.reduce((acc, item) => acc + item.savedInterest, 0),
      addResult,
    }),
    [history, addResult],
  );

  return <CalculationContext.Provider value={value}>{children}</CalculationContext.Provider>;
};

export const useCalculations = () => useContext(CalculationContext);
