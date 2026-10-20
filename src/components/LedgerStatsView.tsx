/**
 * 月度统计：本月结余 + 分类占比 + 近 6 月收支趋势
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  categoryBreakdown,
  filterRecords,
  monthlyTrend,
  shiftMonth,
  summarize,
  type LedgerRecord,
  type LedgerType,
} from '../utils/ledger';
import { fmtDecimal } from '../utils/format';
import { MonthSwitcher } from './MonthSwitcher';

interface Props {
  records: LedgerRecord[];
  month: string;
  onChangeMonth: (month: string) => void;
}

const TYPES: { key: LedgerType; label: string }[] = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
];

const TREND_MAX_H = 92;
const EXPENSE_COLOR = '#FB7B4B';
const INCOME_COLOR = '#17B8A6';

export const LedgerStatsView: React.FC<Props> = ({ records, month, onChangeMonth }) => {
  const [breakdownType, setBreakdownType] = useState<LedgerType>('expense');

  const summary = useMemo(() => summarize(filterRecords(records, { month })), [records, month]);
  const prevSummary = useMemo(
    () => summarize(filterRecords(records, { month: shiftMonth(month, -1) })),
    [records, month],
  );
  const slices = useMemo(
    () => categoryBreakdown(filterRecords(records, { month }), breakdownType),
    [records, month, breakdownType],
  );
  const trend = useMemo(() => monthlyTrend(records, month, 6), [records, month]);

  const trendMax = Math.max(1, ...trend.map((point) => Math.max(point.expense, point.income)));

  const expenseDelta =
    prevSummary.expense > 0
      ? ((summary.expense - prevSummary.expense) / prevSummary.expense) * 100
      : null;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MonthSwitcher month={month} onChange={onChangeMonth} />

      {/* 结余 */}
      <LinearGradient
        colors={['#E7F7F1', '#F2FBF7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>本月结余</Text>
          <Text style={styles.balanceCount}>{summary.count} 笔记录</Text>
        </View>

        <Text
          style={[styles.balanceValue, summary.balance < 0 && styles.balanceNegative]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
        >
          ¥{fmtDecimal(summary.balance, 2)}
        </Text>

        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>总支出</Text>
            <Text style={[styles.balanceItemValue, styles.expense]} numberOfLines={1}>
              ¥{fmtDecimal(summary.expense, 2)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>总收入</Text>
            <Text style={[styles.balanceItemValue, styles.income]} numberOfLines={1}>
              ¥{fmtDecimal(summary.income, 2)}
            </Text>
          </View>
        </View>

        {expenseDelta !== null ? (
          <View style={styles.deltaRow}>
            <Text style={styles.deltaText}>
              支出较上月 {expenseDelta >= 0 ? '增加' : '减少'}{' '}
              {fmtDecimal(Math.abs(expenseDelta), 1)}%
            </Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* 分类占比 */}
      <View style={[styles.card, shadow.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>分类占比</Text>
          <View style={styles.miniTabs}>
            {TYPES.map((item) => {
              const active = item.key === breakdownType;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  style={[styles.miniTab, active && styles.miniTabActive]}
                  onPress={() => setBreakdownType(item.key)}
                >
                  <Text style={[styles.miniTabText, active && styles.miniTabTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {slices.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {formatEmpty(breakdownType, month)}
            </Text>
          </View>
        ) : (
          slices.map((slice) => (
            <View key={slice.id} style={styles.sliceRow}>
              <View style={styles.sliceHead}>
                <Text style={styles.sliceIcon}>{slice.icon}</Text>
                <Text style={styles.sliceName}>{slice.name}</Text>
                <Text style={styles.slicePercent}>{fmtDecimal(slice.percent, 1)}%</Text>
                <Text style={styles.sliceAmount}>¥{fmtDecimal(slice.amount, 2)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(slice.percent, 1.5)}%`,
                      backgroundColor: slice.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>

      {/* 近 6 个月趋势 */}
      <View style={[styles.card, shadow.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>近 6 个月趋势</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: EXPENSE_COLOR }]} />
              <Text style={styles.legendText}>支出</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: INCOME_COLOR }]} />
              <Text style={styles.legendText}>收入</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartRow}>
          {trend.map((point) => {
            const active = point.month === month;
            return (
              <Pressable
                key={point.month}
                accessibilityRole="button"
                accessibilityLabel={`${point.label}支出 ${point.expense} 元，收入 ${point.income} 元`}
                style={styles.chartCol}
                onPress={() => onChangeMonth(point.month)}
              >
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((point.expense / trendMax) * TREND_MAX_H, point.expense > 0 ? 3 : 1.5),
                        backgroundColor: EXPENSE_COLOR,
                        opacity: active ? 1 : 0.55,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((point.income / trendMax) * TREND_MAX_H, point.income > 0 ? 3 : 1.5),
                        backgroundColor: INCOME_COLOR,
                        opacity: active ? 1 : 0.55,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, active && styles.chartLabelActive]}>
                  {point.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.chartHint}>点击柱子可切换统计月份</Text>
      </View>

      <Text style={styles.footer}>统计口径按记账日期归属月份 · 不含未记账支出</Text>
    </ScrollView>
  );
};

const formatEmpty = (type: LedgerType, month: string) => {
  const [year, value] = month.split('-');
  return `${year}年${Number(value)}月还没有${type === 'expense' ? '支出' : '收入'}记录`;
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },

  /* 结余卡 */
  balanceCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CDE9DE',
    padding: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: '#4F8C7A',
  },
  balanceCount: {
    fontSize: fontSize.mini,
    color: '#6D9C8D',
  },
  balanceValue: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  balanceNegative: {
    color: colors.red,
  },
  balanceRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  balanceItemValue: {
    marginTop: 3,
    fontSize: fontSize.normal,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  balanceDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.divider,
  },
  expense: {
    color: colors.red,
  },
  income: {
    color: colors.green,
  },
  deltaRow: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  deltaText: {
    fontSize: fontSize.mini,
    color: '#4F8C7A',
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

  /* 分类占比 */
  miniTabs: {
    flexDirection: 'row',
    backgroundColor: '#EFF2F1',
    borderRadius: radius.pill,
    padding: 2,
  },
  miniTab: {
    height: 24,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTabActive: {
    backgroundColor: colors.card,
  },
  miniTabText: {
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  miniTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sliceRow: {
    marginTop: spacing.sm,
  },
  sliceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sliceIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  sliceName: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.textStrong,
  },
  slicePercent: {
    width: 52,
    textAlign: 'right',
    fontSize: fontSize.small,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  sliceAmount: {
    width: 92,
    textAlign: 'right',
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textStrong,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F0F3F2',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },

  /* 趋势 */
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  bars: {
    height: TREND_MAX_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 9,
    borderRadius: 2,
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
  chartHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.caption,
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
});
