/**
 * 计算记录：累计计算次数 + 近 7 天趋势 + 各工具使用明细
 */
import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import { useCalcStats } from '../context/CalcStatsContext';
import { sortToolRows, fmtLastUsed, type CalcKind } from '../utils/calcStats';
import { useToast } from '../components/Toast';
import { ToolIcon } from '../components/icons/ToolIcons';
import { BackIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles, useTileThemes } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** 各工具路由参数都是 undefined，这里逐个列出以保持类型安全 */
const useOpenTool = () => {
  const navigation = useNavigation<Navigation>();
  return useCallback(
    (kind: CalcKind) => {
      switch (kind) {
        case 'mortgage':
          navigation.navigate('MortgageCalculator');
          break;
        case 'deposit':
          navigation.navigate('DepositCalculator');
          break;
        case 'financial':
          navigation.navigate('FinancialCalculator');
          break;
        case 'tax':
          navigation.navigate('TaxCalculator');
          break;
        case 'currency':
          navigation.navigate('CurrencyConverter');
          break;
        case 'unit':
          navigation.navigate('UnitConverter');
          break;
      }
    },
    [navigation],
  );
};

export const CalcRecordsScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);
  const tileThemes = useTileThemes();

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { summary, reset } = useCalcStats();
  const openTool = useOpenTool();

  const rows = sortToolRows(summary.tools);
  const maxDaily = Math.max(1, ...summary.daily.map((point) => point.count));

  const handleClear = useCallback(() => {
    Alert.alert('清空计算记录', '累计次数与每日记录都会被清空，且无法恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => {
          reset();
          showToast('计算记录已清空');
        },
      },
    ]);
  }, [reset, showToast]);

  return (
    <LinearGradient colors={[colors.screenFrom, colors.screenTo]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        {summary.total > 0 ? (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleClear}>
            <Text style={styles.clearText}>清空</Text>
          </Pressable>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroTitle}>计算记录</Text>
        <Text style={styles.heroSubtitle}>每一次测算都记在这里，数据只存在本机</Text>

        {/* 累计次数 */}
        <LinearGradient
          colors={[colors.mintFrom, colors.mintTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.mintBorder }]}
        >
          <Text style={styles.heroLabel}>累计计算</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>{summary.total}</Text>
            <Text style={styles.totalUnit}>次</Text>
          </View>
          <Text style={styles.heroHint}>
            {summary.today > 0 ? `今天 ${summary.today} 次` : '今天还没有计算'}
            {summary.streak > 1 ? ` · 连续 ${summary.streak} 天` : ''}
          </Text>

          <View style={styles.heroDivider} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.today}</Text>
              <Text style={styles.heroStatLabel}>今日</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.last7}</Text>
              <Text style={styles.heroStatLabel}>近 7 天</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{summary.activeTools}</Text>
              <Text style={styles.heroStatLabel}>用过的工具</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 近 7 天趋势 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>近 7 天</Text>
            <Text style={styles.cardHint}>
              {summary.weekDelta === null
                ? `共 ${summary.last7} 次`
                : `较上周 ${summary.weekDelta >= 0 ? '+' : ''}${summary.weekDelta}%`}
            </Text>
          </View>

          <View style={styles.chart}>
            {summary.daily.map((point) => {
              const ratio = point.count / maxDaily;
              return (
                <View key={point.date} style={styles.chartCol}>
                  <Text style={[styles.chartValue, point.count === 0 && styles.chartValueZero]}>
                    {point.count > 0 ? point.count : ''}
                  </Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: point.count > 0 ? Math.max(8, ratio * 56) : 4,
                          backgroundColor: point.isToday
                            ? colors.primary
                            : point.count > 0
                              ? colors.primaryLight
                              : colors.divider,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, point.isToday && styles.chartLabelToday]}>
                    {point.isToday ? '今天' : point.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 工具明细 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>按工具看</Text>
            <Text style={styles.cardHint}>点击直接进入</Text>
          </View>

          {rows.map((row, index) => {
            const tile = tileThemes[row.tile];
            return (
              <Pressable
                key={row.key}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.toolRow,
                  index > 0 && styles.toolRowDivider,
                  pressed && styles.pressed,
                ]}
                onPress={() => openTool(row.key)}
              >
                <View style={[styles.toolTile, { backgroundColor: tile.bg }]}>
                  <ToolIcon name={row.icon} size={20} color={tile.color} />
                </View>
                <View style={styles.toolText}>
                  <Text style={styles.toolName}>{row.name}</Text>
                  <Text style={styles.toolMeta} numberOfLines={1}>
                    {row.count > 0 ? fmtLastUsed(row.lastAt) : row.desc}
                    {row.lastSummary ? ` · ${row.lastSummary}` : ''}
                  </Text>
                </View>
                <View style={styles.toolRight}>
                  <Text style={[styles.toolCount, row.count === 0 && styles.toolCountZero]}>
                    {row.count}
                  </Text>
                  <Text style={styles.toolCountUnit}>次</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footer}>
          按钮类工具（房贷、个税）每点一次「开始计算」记一次；实时类工具（存款、理财、汇率、单位）在改动过参数后离开页面记一次，不会因为只是打开看看而虚增。
        </Text>
      </ScrollView>
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
  headerPlaceholder: {
    width: 22,
  },
  clearText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },

  /* 累计卡片 */
  heroCard: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  heroLabel: {
    fontSize: fontSize.small,
    color: colors.onMint,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  totalUnit: {
    marginLeft: 6,
    marginBottom: 8,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.onMint,
  },
  heroHint: {
    marginTop: 2,
    fontSize: fontSize.body,
    color: colors.onMint,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.mintBorder,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.mintBorder,
  },
  heroStatValue: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  heroStatLabel: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.onMint,
  },

  /* 通用卡片 */
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  cardHint: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  /* 柱状图 */
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartValue: {
    height: 14,
    fontSize: fontSize.mini,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  chartValueZero: {
    color: colors.textPlaceholder,
  },
  chartTrack: {
    height: 56,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 18,
    borderRadius: 6,
  },
  chartLabel: {
    marginTop: 6,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  chartLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* 工具行 */
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  toolRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pressed: {
    opacity: 0.7,
  },
  toolTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: {
    flex: 1,
  },
  toolName: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.text,
  },
  toolMeta: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  toolRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  toolCount: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  toolCountZero: {
    color: colors.textPlaceholder,
  },
  toolCountUnit: {
    marginBottom: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  footer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 18,
    color: colors.textTertiary,
  },
});
