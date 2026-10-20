/** 记账本本地存储（AsyncStorage，对应 Web 端 localStorage 的 ledger_records） */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryOf, type LedgerRecord, type LedgerType } from './ledger';

export const LEDGER_STORAGE_KEY = 'ledger_records';

const normalize = (value: unknown): LedgerRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<LedgerRecord>;

  if (typeof item.id !== 'string' || !item.id) return null;
  if (item.type !== 'expense' && item.type !== 'income') return null;
  if (typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount <= 0) return null;
  if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return null;

  const type = item.type as LedgerType;
  const category = typeof item.category === 'string' ? item.category : 'other';

  return {
    id: item.id,
    type,
    amount: item.amount,
    category,
    categoryIcon:
      typeof item.categoryIcon === 'string' && item.categoryIcon
        ? item.categoryIcon
        : categoryOf(type, category).icon,
    date: item.date,
    time: typeof item.time === 'string' && item.time ? item.time : '00:00',
    note: typeof item.note === 'string' ? item.note : '',
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0,
  };
};

/** 读取全部记录，损坏或不存在时返回空数组 */
export async function readLedgerRecords(): Promise<LedgerRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalize)
      .filter((record): record is LedgerRecord => record !== null);
  } catch {
    return [];
  }
}

/** 写入全部记录（覆盖），失败不阻断本次操作 */
export async function writeLedgerRecords(records: LedgerRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 忽略存储异常（如空间不足），本次记录仍在内存中
  }
}
