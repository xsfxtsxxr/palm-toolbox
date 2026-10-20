/**
 * 计算次数记录 hook
 *
 * - useCalcRecorder：按钮型计算器（房贷 / 个税）在「开始计算」时调用
 * - useCalcDirty + useCalcCommitOnLeave：实时型计算器（存款 / 理财 / 汇率 / 单位）
 *   参数被改动过、并且带着有效结果离开页面时算一次，避免「打开看一眼」也被计入
 */
import { useCallback, useEffect, useRef } from 'react';
import { useCalcStats } from '../context/CalcStatsContext';
import type { CalcKind } from '../utils/calcStats';

export function useCalcRecorder(kind: CalcKind) {
  const { record } = useCalcStats();
  const commit = useCallback((summary?: string) => record(kind, summary), [kind, record]);
  return { commit };
}

/**
 * 参数是否被用户改动过。
 * 传一个把关键参数拼起来的字符串即可（如 `${amount}|${rate}|${date}`）。
 */
export function useCalcDirty(signature: string) {
  const prev = useRef<string | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = signature;
      return;
    }
    if (prev.current !== signature) {
      prev.current = signature;
      dirty.current = true;
    }
  });

  return dirty;
}

/** 离开页面时若改动过且有有效结果，记一次 */
export function useCalcCommitOnLeave(
  kind: CalcKind,
  summary: string | null,
  dirty: React.RefObject<boolean>,
) {
  const { record } = useCalcStats();
  const latest = useRef<string | null>(summary);

  useEffect(() => {
    latest.current = summary;
  });

  useEffect(
    () => () => {
      if (dirty.current && latest.current) record(kind, latest.current);
    },
    [kind, record, dirty],
  );
}
