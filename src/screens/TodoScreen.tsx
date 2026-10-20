/**
 * 待办清单：筛选 Tab + 快捷添加 + 按时间分组列表 + 多选批量操作
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  FILTERS,
  createTodo,
  filterTodos,
  formatDateLabel,
  groupCompleted,
  groupTodos,
  isOverdue,
  parseQuickInput,
  todoStats,
  todayISO,
  validateContent,
  type Todo,
  type TodoDraft,
  type TodoFilter,
} from '../utils/todo';
import { readTodos, writeTodos } from '../utils/todoStorage';
import { useBottomInset } from '../hooks/useKeyboardHeight';
import { TodoQuickAdd } from '../components/TodoQuickAdd';
import { TodoRow } from '../components/TodoRow';
import { TodoDoneSummary } from '../components/TodoStatsView';
import { InfoModal } from '../components/InfoModal';
import { useToast } from '../components/Toast';
import { BackIcon, ChartTabIcon, InfoIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const HELP_TEXT =
  '待办清单帮你把「要做的事」按日期排好，只存在本机。\n\n' +
  '· 快捷添加：底部输入框写一句话，回车即创建；能自动识别「明天」「周五」「10月25日」「下午3点」「17:30」，句首加「重要 / 随意」可直接设优先级。\n' +
  '· 筛选：全部（未完成）/ 今天 / 重要 / 已完成；已完成列表顶部可查看统计。\n' +
  '· 勾选：点左侧圆圈即完成，内容会划线并移入「已完成」；再点一次恢复。\n' +
  '· 编辑 / 删除：点卡片进入详情页修改，或在卡片上左滑直接编辑、删除。\n' +
  '· 批量：长按任意卡片进入多选，可批量标记完成或删除。\n' +
  '· 过期：截止日期早于今天且未完成的卡片会变成橙色边框，并归入「已过期」分组。\n\n' +
  '待办数据保存在本机，卸载应用会一并清除。';

const EMPTY_TEXT: Record<TodoFilter, { icon: string; title: string; text: string }> = {
  all: { icon: '🌤', title: '还没有待办', text: '在下方输入框写下第一件要做的事' },
  today: { icon: '☕️', title: '今天没有待办', text: '享受一下清闲，或添加一件今天的事' },
  important: { icon: '🎯', title: '没有重要待办', text: '把重要的事标成「重要」，就会出现在这里' },
  done: { icon: '🏅', title: '还没有完成的待办', text: '勾选左侧圆圈即可完成第一件' },
};

export const TodoScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  /** 键盘弹起时底部栏抬到键盘之上，避免输入框被遮挡 */
  const bottomInset = useBottomInset(insets.bottom);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [today, setToday] = useState(todayISO());
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [infoVisible, setInfoVisible] = useState(false);

  const load = useCallback(async () => {
    const list = await readTodos();
    setTodos(list);
    setToday(todayISO());
    setLoading(false);
  }, []);

  const persist = useCallback((next: Todo[]) => {
    setTodos(next);
    void writeTodos(next);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const list = await readTodos();
      if (!alive) return;
      setTodos(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 从详情页返回后刷新（可能新增 / 编辑 / 删除）
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        void load();
      }),
    [navigation, load],
  );

  const counts = useMemo(
    () => ({
      all: todos.filter((todo) => !todo.completed).length,
      today: todos.filter((todo) => !todo.completed && todo.date === today).length,
      important: todos.filter((todo) => !todo.completed && todo.priority === 'high').length,
      done: todos.filter((todo) => todo.completed).length,
    }),
    [todos, today],
  );

  const overdueCount = useMemo(
    () => todos.filter((todo) => isOverdue(todo, today)).length,
    [todos, today],
  );

  const stats = useMemo(() => todoStats(todos, today), [todos, today]);

  const groups = useMemo(() => {
    if (filter === 'done') return groupCompleted(todos, today);
    if (filter === 'all') return groupTodos(todos, today);
    const list = filterTodos(todos, filter, today);
    return list.length > 0 ? [{ key: filter, label: '', todos: list }] : [];
  }, [filter, todos, today]);

  const visibleIds = useMemo(() => groups.flatMap((group) => group.todos.map((todo) => todo.id)), [groups]);

  const exitSelection = () => {
    setSelecting(false);
    setSelected([]);
  };

  const switchFilter = (next: TodoFilter) => {
    if (next === filter) return;
    Keyboard.dismiss();
    if (selecting) exitSelection();
    setFilter(next);
  };

  const handleAdd = (text: string) => {
    const parsed = parseQuickInput(text, today);
    const error = validateContent(parsed.content);
    if (error) {
      showToast(error);
      return;
    }

    const draft: TodoDraft = {
      content: parsed.content,
      date: parsed.date,
      time: parsed.time,
      priority: parsed.priority,
      category: null,
    };
    persist([createTodo(draft), ...todos]);
    if (filter === 'done') setFilter('all');

    const label = formatDateLabel(parsed.date, today);
    showToast(`已添加：${label}${parsed.time ? ` ${parsed.time}` : ''}`);
  };

  const handleToggle = (todo: Todo) => {
    persist(
      todos.map((item) =>
        item.id === todo.id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: item.completed ? null : Date.now(),
            }
          : item,
      ),
    );
    showToast(todo.completed ? '已恢复为待办' : '完成啦，继续保持 🎉');
  };

  const handleDelete = (todo: Todo) => {
    Alert.alert('删除这条待办？', todo.content, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          persist(todos.filter((item) => item.id !== todo.id));
          setSelected((prev) => prev.filter((id) => id !== todo.id));
          showToast('已删除');
        },
      },
    ]);
  };

  const handleSelect = (todo: Todo) => {
    setSelected((prev) =>
      prev.includes(todo.id) ? prev.filter((id) => id !== todo.id) : [...prev, todo.id],
    );
  };

  const handleLongPress = (todo: Todo) => {
    Keyboard.dismiss();
    setSelecting(true);
    setSelected([todo.id]);
  };

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.length === visibleIds.length ? [] : visibleIds));
  };

  const completeSelected = () => {
    if (selected.length === 0) {
      showToast('先选择要操作的待办');
      return;
    }
    const now = Date.now();
    persist(
      todos.map((todo) =>
        selected.includes(todo.id) && !todo.completed
          ? { ...todo, completed: true, completedAt: now }
          : todo,
      ),
    );
    showToast(`已完成 ${selected.length} 项`);
    exitSelection();
  };

  const deleteSelected = () => {
    if (selected.length === 0) {
      showToast('先选择要操作的待办');
      return;
    }
    Alert.alert('删除所选待办？', `共 ${selected.length} 项，删除后无法恢复`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          persist(todos.filter((todo) => !selected.includes(todo.id)));
          showToast(`已删除 ${selected.length} 项`);
          exitSelection();
        },
      },
    ]);
  };

  const fetchFresh = () => {
    setRefreshing(true);
    void load().then(() => setRefreshing(false));
  };

  const empty = EMPTY_TEXT[filter];

  return (
    <LinearGradient colors={[colors.screenFrom, colors.screenTo]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => (selecting ? exitSelection() : navigation.goBack())}
        >
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>

        <Text style={styles.headerTitle}>{selecting ? `已选 ${selected.length} 项` : '待办清单'}</Text>

        {selecting ? (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={exitSelection}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        ) : (
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => navigation.navigate('TodoStats')}
            >
              <ChartTabIcon size={21} color={colors.textSecondary} />
            </Pressable>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setInfoVisible(true)}>
              <InfoIcon size={21} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>待办清单</Text>
        <Text style={styles.heroSubtitle}>
          待处理 {counts.all} 项
          {overdueCount > 0 ? ` · 已过期 ${overdueCount} 项` : counts.today > 0 ? ` · 今天 ${counts.today} 项` : ''}
        </Text>
      </View>

      {/* 筛选 Tab */}
      <View style={styles.tabs}>
        {FILTERS.map((item) => {
          const active = item.key === filter;
          const count = counts[item.key];
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => switchFilter(item.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              {count > 0 ? (
                <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>正在读取待办…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchFresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filter === 'done' ? (
            <TodoDoneSummary stats={stats} onPressDetail={() => navigation.navigate('TodoStats')} />
          ) : null}

          {groups.length === 0 ? (
            <View style={[styles.emptyCard, shadow.card]}>
              <Text style={styles.emptyIcon}>{empty.icon}</Text>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptyText}>{empty.text}</Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.key} style={styles.groupBlock}>
                {group.label ? (
                  <View style={styles.groupHeader}>
                    <Text style={[styles.groupTitle, group.key === 'overdue' && styles.groupTitleOverdue]}>
                      {group.label}
                    </Text>
                    <Text style={styles.groupCount}>{group.todos.length}</Text>
                  </View>
                ) : null}

                <View style={[styles.groupCard, shadow.card]}>
                  {group.todos.map((todo, index) => (
                    <View key={todo.id} style={index > 0 ? styles.rowDivider : undefined}>
                      <TodoRow
                        todo={todo}
                        today={today}
                        selecting={selecting}
                        selected={selected.includes(todo.id)}
                        onToggle={handleToggle}
                        onOpen={(item) => navigation.navigate('TodoEdit', { todo: item })}
                        onDelete={handleDelete}
                        onLongPress={handleLongPress}
                        onSelect={handleSelect}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}

          <Text style={styles.footer}>
            长按卡片可多选 · 左滑可编辑或删除 · 待办仅保存在本机
          </Text>
        </ScrollView>
      )}

      {/* 底部：多选操作栏 / 快捷添加 */}
      {selecting ? (
        <View style={[styles.selectionBar, { paddingBottom: bottomInset + spacing.sm }]}>
          <Pressable accessibilityRole="button" style={styles.selectionGhost} onPress={toggleSelectAll}>
            <Text style={styles.selectionGhostText}>
              {selected.length === visibleIds.length ? '取消全选' : '全选'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.selectionBtn, styles.selectionPrimary]}
            onPress={completeSelected}
          >
            <Text style={styles.selectionPrimaryText}>标记完成</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.selectionBtn, styles.selectionDanger]}
            onPress={deleteSelected}
          >
            <Text style={styles.selectionDangerText}>删除</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ paddingBottom: bottomInset }}>
          <TodoQuickAdd
            today={today}
            onAdd={handleAdd}
            onDetail={() => navigation.navigate('TodoEdit', {})}
          />
        </View>
      )}

      <InfoModal
        visible={infoVisible}
        title="待办清单说明"
        content={HELP_TEXT}
        onClose={() => setInfoVisible(false)}
      />
    </LinearGradient>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },
  hero: {
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },

  /* Tab */
  tabs: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    backgroundColor: '#E9EDF3',
    borderRadius: radius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.card,
    ...shadow.card,
  },
  tabText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabCount: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  tabCountActive: {
    color: '#4F8C7A',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  /* 分组 */
  groupBlock: {
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xs,
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: '#2C3A36',
  },
  groupTitleOverdue: {
    color: colors.orange,
  },
  groupCount: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  /* 空状态 */
  emptyCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.textStrong,
  },
  emptyText: {
    marginTop: 4,
    fontSize: fontSize.small,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  footer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  /* 多选栏 */
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  selectionGhost: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionGhostText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectionBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionPrimary: {
    backgroundColor: colors.primary,
  },
  selectionPrimaryText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.white,
  },
  selectionDanger: {
    backgroundColor: colors.redLight,
  },
  selectionDangerText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.red,
  },
});
