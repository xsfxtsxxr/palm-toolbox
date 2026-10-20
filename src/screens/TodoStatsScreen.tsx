/**
 * 待办统计页：完成汇总 + 连续打卡 + 本周趋势 + 分类分布
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, spacing } from '../theme/theme';
import { todoStats, todayISO, type Todo } from '../utils/todo';
import { readTodos } from '../utils/todoStorage';
import { TodoStatsView } from '../components/TodoStatsView';
import { BackIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const TodoStatsScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => todoStats(todos, todayISO()), [todos]);

  const subtitle = loading
    ? '正在统计…'
    : stats.totalDone === 0
      ? '从第一件小事开始，完成会累积成习惯'
      : stats.streak >= 3
        ? `已连续 ${stats.streak} 天有完成记录，保持住`
        : `本周已完成 ${stats.weekDone} 项，继续加油`;

  return (
    <LinearGradient colors={[colors.screenFrom, colors.screenTo]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>待办统计</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>完成情况</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          <TodoStatsView stats={stats} />
        </ScrollView>
      )}
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
  headerPlaceholder: {
    width: 22,
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
