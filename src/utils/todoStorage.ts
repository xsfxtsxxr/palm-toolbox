/** 待办清单本地存储（AsyncStorage，对应 Web 端 localStorage 的 todo_list） */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_CONTENT, type Todo, type TodoCategoryId, type TodoPriority } from './todo';

export const TODO_STORAGE_KEY = 'todo_list';

const PRIORITY_SET = new Set<TodoPriority>(['high', 'medium', 'low']);
const CATEGORY_SET = new Set<TodoCategoryId>(['work', 'life', 'study', 'shopping']);

const normalize = (value: unknown): Todo | null => {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Todo>;

  if (typeof item.id !== 'string' || !item.id) return null;
  if (typeof item.content !== 'string' || !item.content.trim()) return null;
  if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return null;

  const completed = item.completed === true;
  const priority = PRIORITY_SET.has(item.priority as TodoPriority)
    ? (item.priority as TodoPriority)
    : 'medium';
  const category = CATEGORY_SET.has(item.category as TodoCategoryId)
    ? (item.category as TodoCategoryId)
    : null;

  return {
    id: item.id,
    content: item.content.trim().slice(0, MAX_CONTENT),
    date: item.date,
    time: typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time) ? item.time : '',
    priority,
    category,
    completed,
    completedAt: completed && typeof item.completedAt === 'number' ? item.completedAt : null,
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0,
  };
};

/** 读取全部待办，损坏或不存在时返回空数组 */
export async function readTodos(): Promise<Todo[]> {
  try {
    const raw = await AsyncStorage.getItem(TODO_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((todo): todo is Todo => todo !== null);
  } catch {
    return [];
  }
}

/** 覆盖写入全部待办，失败不阻断本次操作 */
export async function writeTodos(todos: Todo[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 忽略存储异常（如空间不足），本次改动仍在内存中
  }
}
