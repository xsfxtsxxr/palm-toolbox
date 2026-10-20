/**
 * 流水明细：月份切换 + 当月汇总 + 按日分组小计 + 左滑编辑删除
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  filterRecords,
  formatDateCN,
  groupByDate,
  summarize,
  todayISO,
  weekdayCN,
  type LedgerRecord,
  type LedgerType,
} from '../utils/ledger';
import { fmtDecimal } from '../utils/format';
import { LedgerRow } from './LedgerRow';
import { MonthSwitcher } from './MonthSwitcher';
import { ExportIcon, PlusCircleIcon } from './icons/UIIcons';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  records: LedgerRecord[];
  month: string;
  onChangeMonth: (month: string) => void;
  onEdit: (record: LedgerRecord) => void;
  onDelete: (record: LedgerRecord) => void;
  onCreate: () => void;
  onExport: (records: LedgerRecord[], month: string) => void;
}

const FILTERS: { key: LedgerType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
];

export const LedgerListView: React.FC<Props> = ({
  records,
  month,
  onChangeMonth,
  onEdit,
  onDelete,
  onCreate,
  onExport,
}) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const [filter, setFilter] = useState<LedgerType | 'all'>('all');

  const monthRecords = useMemo(() => filterRecords(records, { month }), [records, month]);
  const summary = useMemo(() => summarize(monthRecords), [monthRecords]);
  const groups = useMemo(
    () => groupByDate(filterRecords(records, { month, type: filter })),
    [records, month, filter],
  );

  const today = todayISO();
  const filteredCount = groups.reduce((sum, group) => sum + group.records.length, 0);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MonthSwitcher month={month} onChange={onChangeMonth} />

      {/* 当月汇总 */}
      <LinearGradient
        colors={[colors.mintFrom, colors.mintTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>支出</Text>
          <Text style={[styles.summaryValue, styles.expense]} numberOfLines={1} adjustsFontSizeToFit>
            ¥{fmtDecimal(summary.expense, 2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>收入</Text>
          <Text style={[styles.summaryValue, styles.income]} numberOfLines={1} adjustsFontSizeToFit>
            ¥{fmtDecimal(summary.income, 2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>结余</Text>
          <Text
            style={[styles.summaryValue, summary.balance < 0 ? styles.expense : styles.balance]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            ¥{fmtDecimal(summary.balance, 2)}
          </Text>
        </View>
      </LinearGradient>

      {/* 类型筛选 */}
      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = item.key === filter;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.filterCount}>共 {filteredCount} 笔</Text>
      </View>

      {/* 按日分组 */}
      {groups.length === 0 ? (
        <View style={[styles.emptyCard, shadow.card]}>
          <Text style={styles.emptyIcon}>{monthRecords.length === 0 ? '🧾' : '🔍'}</Text>
          <Text style={styles.emptyTitle}>
            {monthRecords.length === 0 ? '本月还没有记录' : '没有符合条件的记录'}
          </Text>
          <Text style={styles.emptyText}>
            {monthRecords.length === 0
              ? '把每一笔开销记下来，月末才知道钱花在哪'
              : '换个筛选条件，或切到其他月份看看'}
          </Text>
          {monthRecords.length === 0 ? (
            <Pressable accessibilityRole="button" style={styles.emptyBtn} onPress={onCreate}>
              <PlusCircleIcon size={16} color={colors.primary} />
              <Text style={styles.emptyBtnText}>记第一笔</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.date} style={styles.groupBlock}>
            <View style={styles.dayHeader}>
              <View style={styles.dayLeft}>
                <Text style={styles.dayText}>{formatDateCN(group.date)}</Text>
                <Text style={styles.weekday}>{weekdayCN(group.date)}</Text>
                {group.date === today ? <Text style={styles.todayTag}>今天</Text> : null}
              </View>
              <View style={styles.dayRight}>
                {group.expense > 0 ? (
                  <Text style={styles.daySubExpense}>支 {fmtDecimal(group.expense, 2)}</Text>
                ) : null}
                {group.income > 0 ? (
                  <Text style={styles.daySubIncome}>收 {fmtDecimal(group.income, 2)}</Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.groupCard, shadow.card]}>
              {group.records.map((record, index) => (
                <View key={record.id} style={index > 0 ? styles.rowDivider : undefined}>
                  <LedgerRow record={record} onPress={onEdit} onEdit={onEdit} onDelete={onDelete} />
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {monthRecords.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.exportBtn, pressed && styles.exportBtnPressed]}
          onPress={() => onExport(monthRecords, month)}
        >
          <ExportIcon size={15} color={colors.primary} />
          <Text style={styles.exportText}>导出本月流水（CSV）</Text>
        </Pressable>
      ) : null}

      <Text style={styles.footer}>左滑单条记录可编辑或删除 · 数据仅保存在本机</Text>
    </ScrollView>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },

  /* 汇总 */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CDE9DE',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.mini,
    color: '#4F8C7A',
  },
  summaryValue: {
    marginTop: 3,
    fontSize: fontSize.title,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  expense: {
    color: colors.red,
  },
  income: {
    color: colors.green,
  },
  balance: {
    color: colors.primary,
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(13, 74, 61, 0.12)',
  },

  /* 筛选 */
  filterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterChip: {
    height: 28,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  filterCount: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  /* 分组 */
  groupBlock: {
    marginTop: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: 6,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textStrong,
  },
  weekday: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  todayTag: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: '#4F8C7A',
    backgroundColor: '#E7F2EF',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  daySubExpense: {
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  daySubIncome: {
    fontSize: fontSize.mini,
    color: colors.textSecondary,
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
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 34,
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
  emptyBtn: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: '#EAF4F0',
  },
  emptyBtnText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.primary,
  },

  /* 导出 */
  exportBtn: {
    marginTop: spacing.xl,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDCD1',
    backgroundColor: colors.white,
  },
  exportBtnPressed: {
    backgroundColor: '#EAF4F0',
  },
  exportText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },

  footer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
