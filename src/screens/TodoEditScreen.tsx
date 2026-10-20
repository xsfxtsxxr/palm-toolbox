/**
 * 待办详情页：新建 / 编辑内容、日期、时间、优先级与分类
 */
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  MAX_CONTENT,
  PRIORITIES,
  TODO_CATEGORIES,
  addDays,
  applyTodoDraft,
  createTodo,
  formatDateLabel,
  startOfWeek,
  todayISO,
  validateContent,
  type TodoCategoryId,
  type TodoPriority,
} from '../utils/todo';
import { readTodos, writeTodos } from '../utils/todoStorage';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { MonthPickerModal } from '../components/MonthPickerModal';
import { TimePickerModal } from '../components/TimePickerModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { useToast } from '../components/Toast';
import { BackIcon, CalendarIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TodoEdit'>;

const TIME_PRESETS = ['', '09:00', '12:00', '18:00', '20:00'];

const partsOf = (date: string) => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
  day: Number(date.slice(8, 10)),
});

export const TodoEditScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  /** 键盘弹起时让内容可滚出键盘区域，避免底部按钮被遮挡 */
  const keyboardHeight = useKeyboardHeight();

  const editing = route.params?.todo ?? null;
  const today = todayISO();

  const [content, setContent] = useState(editing?.content ?? '');
  const [date, setDate] = useState(editing?.date ?? today);
  const [time, setTime] = useState(editing?.time ?? '');
  const [priority, setPriority] = useState<TodoPriority>(editing?.priority ?? 'medium');
  const [category, setCategory] = useState<TodoCategoryId | null>(editing?.category ?? null);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const dateParts = partsOf(date);

  // 快捷日期：今天 / 明天 / 后天 / 本周日
  const datePresets = [
    { label: '今天', value: today },
    { label: '明天', value: addDays(today, 1) },
    { label: '后天', value: addDays(today, 2) },
    { label: '本周日', value: addDays(startOfWeek(today), 6) },
  ];

  const handleSave = async () => {
    const error = validateContent(content);
    if (error) {
      showToast(error);
      return;
    }

    Keyboard.dismiss();
    const draft = { content, date, time, priority, category };
    const list = await readTodos();

    if (editing) {
      await writeTodos(list.map((item) => (item.id === editing.id ? applyTodoDraft(item, draft) : item)));
      showToast('已保存修改');
    } else {
      await writeTodos([createTodo(draft), ...list]);
      showToast('已添加待办');
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert('删除这条待办？', editing.content, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const list = await readTodos();
            await writeTodos(list.filter((item) => item.id !== editing.id));
            showToast('已删除');
            navigation.goBack();
          })();
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#F7F9F8', '#EEF2F1']} style={styles.container}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
            <BackIcon size={22} color={colors.textStrong} />
          </Pressable>
          <Text style={styles.headerTitle}>{editing ? '编辑待办' : '新建待办'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xxl + keyboardHeight },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* 内容 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>待办内容</Text>
            <Text style={styles.counter}>
              {content.length}/{MAX_CONTENT}
            </Text>
          </View>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="想做什么？如：交电费、写周报"
            placeholderTextColor={colors.textPlaceholder}
            maxLength={MAX_CONTENT}
            multiline
            textAlignVertical="top"
            autoFocus={!editing}
          />
        </View>

        {/* 日期 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>日期</Text>
            <Text style={styles.selectedLabel}>{formatDateLabel(date, today)}</Text>
          </View>

          <View style={styles.chipRow}>
            {datePresets.map((preset) => {
              const active = preset.value === date;
              return (
                <Pressable
                  key={preset.label}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDate(preset.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{preset.label}</Text>
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              style={[styles.chip, styles.chipGhost]}
              onPress={() => setDatePickerVisible(true)}
            >
              <CalendarIcon size={13} color={colors.primary} />
              <Text style={styles.chipGhostText}>
                {date.replace(/-/g, '/').slice(5)}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 时间 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>提醒时间</Text>
            <Text style={styles.selectedLabel}>{time || '不设置'}</Text>
          </View>

          <View style={styles.chipRow}>
            <Pressable
              accessibilityRole="button"
              style={[styles.chip, time === '' && styles.chipActive]}
              onPress={() => setTime('')}
            >
              <Text style={[styles.chipText, time === '' && styles.chipTextActive]}>不设置</Text>
            </Pressable>

            {TIME_PRESETS.filter(Boolean).map((preset) => {
              const active = preset === time;
              return (
                <Pressable
                  key={preset}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTime(preset)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{preset}</Text>
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              style={[styles.chip, styles.chipGhost]}
              onPress={() => setTimePickerVisible(true)}
            >
              <Text style={styles.chipGhostText}>自定义</Text>
            </Pressable>
          </View>
        </View>

        {/* 优先级 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>优先级</Text>
          </View>

          <View style={styles.priorityRow}>
            {PRIORITIES.map((item) => {
              const active = item.id === priority;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  style={[
                    styles.priorityItem,
                    active && { borderColor: item.color, backgroundColor: item.bg },
                  ]}
                  onPress={() => setPriority(item.id)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.priorityText, active && { color: item.color, fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 分类 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>分类</Text>
            <Text style={styles.optional}>选填</Text>
          </View>

          <View style={styles.chipRow}>
            <Pressable
              accessibilityRole="button"
              style={[styles.chip, category === null && styles.chipActive]}
              onPress={() => setCategory(null)}
            >
              <Text style={[styles.chipText, category === null && styles.chipTextActive]}>不分类</Text>
            </Pressable>

            {TODO_CATEGORIES.map((item) => {
              const active = item.id === category;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  style={[styles.chip, active && { backgroundColor: item.color, borderColor: item.color }]}
                  onPress={() => setCategory(item.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item.icon} {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          title={editing ? '保存修改' : '添加待办'}
          onPress={() => void handleSave()}
          style={styles.saveBtn}
        />

        {editing ? (
          <Pressable accessibilityRole="button" style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>删除这条待办</Text>
          </Pressable>
        ) : null}

        <Text style={styles.tip}>
          日期与时间用于排序和过期提醒，未设置时间则只在列表按日期排列
        </Text>
        </ScrollView>
      </View>

      <MonthPickerModal
        key={datePickerVisible ? `todo-date-${date}` : 'todo-date-closed'}
        visible={datePickerVisible}
        year={dateParts.year}
        month={dateParts.month}
        day={dateParts.day}
        title="选择待办日期"
        tip="默认今天，可改为实际需要完成的日期"
        minYear={2000}
        maxYear={2050}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(year, month, day) =>
          setDate(
            `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          )
        }
      />

      <TimePickerModal
        key={timePickerVisible ? `todo-time-${time}` : 'todo-time-closed'}
        visible={timePickerVisible}
        value={time}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={setTime}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
  headerPlaceholder: {
    width: 22,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: '#2C3A36',
  },
  counter: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  optional: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  selectedLabel: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },
  contentInput: {
    minHeight: 76,
    padding: 0,
    fontSize: fontSize.normal,
    lineHeight: 22,
    color: colors.textStrong,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E6EBEA',
    backgroundColor: '#F7F9F8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  chipGhost: {
    backgroundColor: '#EAF4F0',
    borderColor: '#CDE9DE',
  },
  chipGhostText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },

  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityItem: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E6EBEA',
    backgroundColor: '#F7F9F8',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },

  saveBtn: {
    marginTop: spacing.md,
  },
  deleteBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.red,
  },
  tip: {
    marginTop: spacing.md,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
