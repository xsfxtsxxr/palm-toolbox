/**
 * 统计页：房贷计算汇总 + 本金/利息构成图
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useCalculations } from '../context/CalculationContext';
import { fmtMoney, fmtYuan } from '../utils/format';
import { StackedBarChart } from '../components/StackedBarChart';
import { ChartEmptyIcon } from '../components/icons/UIIcons';

const MODE_LABELS: Record<string, string> = {
  reducePayment: '减少月供（期限不变）',
  reduceTerm: '缩短期限（月供不变）',
};

export const StatisticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { history, latest, totalCount, totalSavedInterest } = useCalculations();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>统计</Text>

        {!latest ? (
          <View style={styles.empty}>
            <ChartEmptyIcon size={64} color="#C3CDDD" />
            <Text style={styles.emptyTitle}>暂无统计数据</Text>
            <Text style={styles.emptyDesc}>完成一次房贷计算后，这里将展示还款分析与利息节省趋势</Text>
          </View>
        ) : (
          <>
            {/* 汇总卡片 */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, shadow.card]}>
                <Text style={styles.summaryLabel}>累计计算</Text>
                <Text style={styles.summaryValue}>{totalCount} 次</Text>
              </View>
              <View style={[styles.summaryCard, shadow.card]}>
                <Text style={styles.summaryLabel}>累计节省利息</Text>
                <Text style={[styles.summaryValue, styles.summaryValueAccent]}>
                  {fmtYuan(totalSavedInterest)}
                </Text>
              </View>
            </View>

            {/* 最近一次计算 */}
            <View style={[styles.latestCard, shadow.card]}>
              <Text style={styles.cardTitle}>最近一次计算</Text>
              <View style={styles.latestRow}>
                <View style={styles.latestItem}>
                  <Text style={styles.latestLabel}>原月供</Text>
                  <Text style={styles.latestValue}>{fmtYuan(latest.originalMonthlyPayment)}</Text>
                </View>
                <Text style={styles.latestArrow}>→</Text>
                <View style={styles.latestItem}>
                  <Text style={styles.latestLabel}>新月供</Text>
                  <Text style={[styles.latestValue, styles.latestValueAccent]}>
                    {fmtYuan(latest.newMonthlyPayment)}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>还款方式：{MODE_LABELS[latest.input.mode] ?? '-'}</Text>
                <Text style={styles.metaText}>
                  {latest.fullyRepaid
                    ? '已全额还清'
                    : `剩余 ${latest.newRemainingMonths} 期${latest.reducedMonths > 0 ? `（缩短 ${latest.reducedMonths} 期）` : ''}`}
                </Text>
              </View>
            </View>

            {/* 本金/利息构成图 */}
            <View style={[styles.chartCard, shadow.card]}>
              <Text style={styles.cardTitle}>未来 12 期还款构成</Text>
              <StackedBarChart rows={latest.schedule} />
              <Text style={styles.chartFooter}>
                前 12 期利息合计 {fmtYuan(latest.schedule.slice(0, 12).reduce((a, r) => a + r.interest, 0))}
                ，本金合计 {fmtYuan(latest.schedule.slice(0, 12).reduce((a, r) => a + r.principal, 0))}
              </Text>
            </View>

            {/* 历史记录 */}
            {history.length > 1 ? (
              <View style={[styles.historyCard, shadow.card]}>
                <Text style={styles.cardTitle}>计算记录</Text>
                {history.map((item) => (
                  <View key={item.createdAt} style={styles.historyRow}>
                    <Text style={styles.historyTime}>
                      {new Date(item.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.historyDetail} numberOfLines={1}>
                      本金 {fmtMoney(item.input.remainingPrincipal)} · 提前还 {fmtMoney(item.input.prepayAmount)}
                    </Text>
                    <Text style={styles.historySaved}>省 {fmtMoney(item.savedInterest)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyDesc: {
    marginTop: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.textStrong,
  },
  summaryValueAccent: {
    color: colors.primary,
  },
  latestCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: spacing.md,
  },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestItem: {
    flex: 1,
    alignItems: 'center',
  },
  latestLabel: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },
  latestValue: {
    marginTop: 4,
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.textStrong,
  },
  latestValueAccent: {
    color: colors.primary,
  },
  latestArrow: {
    fontSize: fontSize.large,
    color: colors.textTertiary,
    paddingHorizontal: spacing.sm,
  },
  metaRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  chartFooter: {
    marginTop: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  historyTime: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    width: 76,
  },
  historyDetail: {
    flex: 1,
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  historySaved: {
    fontSize: fontSize.mini,
    color: colors.primary,
    fontWeight: '700',
  },
});
