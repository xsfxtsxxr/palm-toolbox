/**
 * 待办统计：完成汇总、连续打卡、本周完成趋势、分类分布
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import type { TodoStats } from '../utils/todo';
import { ChevronRightIcon } from './icons/UIIcons';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

const CHART_H = 96;

/** 已完成 Tab 顶部的紧凑汇总卡 */
export const TodoDoneSummary: React.FC<{ stats: TodoStats; onPressDetail: () => void }> = ({
  stats,
  onPressDetail,
}) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  return (
  <Pressable
    accessibilityRole="button"
    style={({ pressed }) => [pressed && styles.pressed]}
    onPress={onPressDetail}
  >
    <LinearGradient
      colors={[colors.mintFrom, colors.mintTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.summaryCard}
    >
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>完成情况</Text>
        <View style={styles.summaryLink}>
          <Text style={styles.summaryLinkText}>查看统计</Text>
          <ChevronRightIcon size={13} color="#4F8C7A" />
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.weekDone}</Text>
          <Text style={styles.summaryLabel}>本周完成</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.streak}</Text>
          <Text style={styles.summaryLabel}>连续打卡</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.totalDone}</Text>
          <Text style={styles.summaryLabel}>总计完成</Text>
        </View>
      </View>
    </LinearGradient>
  </Pressable>
);
};

/** 统计页主体 */
export const TodoStatsView: React.FC<{ stats: TodoStats }> = ({ stats }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const maxCount = Math.max(1, ...stats.daily.map((point) => point.count));
  const totalCategory = stats.byCategory.reduce((sum, item) => sum + item.done, 0);

  return (
    <View>
      {/* 4 张统计卡 */}
      <View style={styles.grid}>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>本周完成</Text>
          <Text style={[styles.statValue, styles.statPrimary]}>{stats.weekDone}</Text>
          <Text style={styles.statUnit}>项</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>连续打卡</Text>
          <Text style={[styles.statValue, styles.statOrange]}>{stats.streak}</Text>
          <Text style={styles.statUnit}>天</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>总计完成</Text>
          <Text style={styles.statValue}>{stats.totalDone}</Text>
          <Text style={styles.statUnit}>项</Text>
        </View>
        <View style={[styles.statCard, shadow.card]}>
          <Text style={styles.statLabel}>待处理</Text>
          <Text style={[styles.statValue, stats.overdue > 0 && styles.statRed]}>
            {stats.pending}
          </Text>
          <Text style={styles.statUnit}>项</Text>
        </View>
      </View>

      {stats.overdue > 0 ? (
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>⏰</Text>
          <Text style={styles.alertText}>
            有 {stats.overdue} 项待办已过期，记得尽快处理或改个日期
          </Text>
        </View>
      ) : null}

      {/* 一周完成趋势 */}
      <View style={[styles.card, shadow.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>本周完成趋势</Text>
          <Text style={styles.cardHint}>共 {stats.weekDone} 项</Text>
        </View>

        <View style={styles.chartRow}>
          {stats.daily.map((point) => (
            <View key={point.date} style={styles.chartCol}>
              <Text style={[styles.barValue, point.count === 0 && styles.barValueMuted]}>
                {point.count > 0 ? point.count : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: point.count > 0 ? Math.max((point.count / maxCount) * CHART_H, 6) : 3,
                      backgroundColor: point.isToday ? colors.primary : point.isFuture ? '#E4E9E7' : '#8FC7B6',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartLabel, point.isToday && styles.chartLabelActive]}>
                {point.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 分类分布 */}
      <View style={[styles.card, shadow.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>已完成分类分布</Text>
          <Text style={styles.cardHint}>共 {totalCategory} 项</Text>
        </View>

        {stats.byCategory.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>还没有已完成的待办</Text>
          </View>
        ) : (
          stats.byCategory.map((item) => {
            const percent = totalCategory > 0 ? (item.done / totalCategory) * 100 : 0;
            return (
              <View key={item.id} style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={styles.categoryName}>{item.label}</Text>
                <View style={styles.categoryBarTrack}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      { width: `${Math.max(percent, 3)}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
                <Text style={styles.categoryCount}>{item.done}</Text>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.footer}>统计按完成时间归属自然周（周一为一周起点）</Text>
    </View>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },

  /* 汇总卡 */
  summaryCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CDE9DE',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: '#2C5748',
  },
  summaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  summaryLinkText: {
    fontSize: fontSize.mini,
    color: '#4F8C7A',
  },
  summaryRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: '#4F8C7A',
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(13, 74, 61, 0.12)',
  },

  /* 统计卡 */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },
  statValue: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textStrong,
    fontVariant: ['tabular-nums'],
  },
  statPrimary: {
    color: colors.primary,
  },
  statOrange: {
    color: colors.orange,
  },
  statRed: {
    color: colors.red,
  },
  statUnit: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md + 4,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  alertCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF8F1',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FBDCBC',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  alertIcon: {
    fontSize: 15,
  },
  alertText: {
    flex: 1,
    fontSize: fontSize.small,
    color: '#B26A1F',
    lineHeight: 18,
  },

  /* 通用卡片 */
  card: {
    marginTop: spacing.lg,
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
  cardHint: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  /* 趋势图 */
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    height: 14,
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  barValueMuted: {
    color: 'transparent',
  },
  barTrack: {
    height: CHART_H + 4,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 16,
    borderRadius: radius.sm,
  },
  chartLabel: {
    marginTop: 6,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  chartLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* 分类分布 */
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryName: {
    width: 44,
    fontSize: fontSize.body,
    color: colors.textStrong,
  },
  categoryBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F0F3F2',
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  categoryCount: {
    width: 28,
    textAlign: 'right',
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textStrong,
    fontVariant: ['tabular-nums'],
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },

  footer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
