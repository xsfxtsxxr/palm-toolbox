/**
 * 计算次数本地存储（AsyncStorage，key 与 Web 端 localStorage 保持一致）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyStats, normalizeCalcStats, type CalcStats } from './calcStats';

export const CALC_STATS_KEY = 'calc_stats';

export async function readCalcStats(): Promise<CalcStats> {
  try {
    const raw = await AsyncStorage.getItem(CALC_STATS_KEY);
    if (!raw) return createEmptyStats();
    return normalizeCalcStats(JSON.parse(raw));
  } catch {
    return createEmptyStats();
  }
}

export async function writeCalcStats(stats: CalcStats): Promise<void> {
  try {
    await AsyncStorage.setItem(CALC_STATS_KEY, JSON.stringify(stats));
  } catch {
    // 写失败不影响使用，下次操作会再写
  }
}

export async function clearCalcStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CALC_STATS_KEY);
  } catch {
    // 忽略
  }
}
