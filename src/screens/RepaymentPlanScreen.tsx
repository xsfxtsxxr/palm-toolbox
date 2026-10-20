/**
 * 还款计划结果页：对比统计 + 还款明细表 + 导出
 */
import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, spacing } from '../theme/theme';
import { AmortizationTable } from '../components/AmortizationTable';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';
import { InfoModal } from '../components/InfoModal';
import { BackIcon, ExportIcon, InfoIcon } from '../components/icons/UIIcons';
import { useToast } from '../components/Toast';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RepaymentPlan'>;

const PLAN_INFO =
  '还款计划基于「等额本息」法测算：提前还款后按剩余本金、原贷款利率与剩余期数重新计算月供与利息。\n\n· 月供本金 = 月供总额 − 月供利息；\n· 剩余总额 = 该期还完后尚未归还的本金；\n· 金额四舍五入至元，末期还款自动吸收尾差。\n\n数据仅供参考，实际以贷款合同与银行核算为准。';

export const RepaymentPlanScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const { result } = route.params;
  const [infoVisible, setInfoVisible] = React.useState(false);

  const handleExport = async () => {
    if (result.schedule.length === 0) {
      showToast('暂无还款明细可导出');
      return;
    }
    const header = '还款日期,月供总额,月供本金,月供利息,剩余总额';
    const lines = result.schedule.map((row) =>
      [
        row.paymentDate,
        Math.round(row.payment),
        Math.round(row.principal),
        Math.round(row.interest),
        Math.round(row.balance),
      ].join(','),
    );
    const csv = [header, ...lines].join('\n');
    try {
      await Share.share({ message: csv, title: '还款计划' });
    } catch {
      showToast('导出失败，请稍后重试');
    }
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>还款计划</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setInfoVisible(true)}>
          <InfoIcon size={22} color={colors.textStrong} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 对比统计 */}
        <View style={styles.statsRow}>
          <StatCard label="原月供" value={result.originalMonthlyPayment} />
          <StatCard label="新月供" value={result.newMonthlyPayment} />
          <StatCard label="节省利息" value={result.savedInterest} highlight />
        </View>

        {/* 还款明细 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>未来12个月还款明细</Text>
          <Pressable accessibilityRole="button" style={styles.exportBtn} onPress={handleExport}>
            <ExportIcon size={14} color={colors.primary} />
            <Text style={styles.exportText}>导出</Text>
          </Pressable>
        </View>

        {result.fullyRepaid ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>贷款已全额还清</Text>
            <Text style={styles.noticeText}>
              提前偿还金额已覆盖全部剩余本金，无需后续还款，共节省利息 ¥
              {Math.round(result.savedInterest).toLocaleString('en-US')}
            </Text>
          </View>
        ) : (
          <AmortizationTable rows={result.schedule} />
        )}

        {/* 再算一次 */}
        <PrimaryButton
          title="再算一次"
          onPress={() => navigation.goBack()}
          style={styles.recalcBtn}
        />
      </ScrollView>

      <InfoModal visible={infoVisible} title="数据说明" content={PLAN_INFO} onClose={() => setInfoVisible(false)} />
    </View>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },
  noticeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: spacing.sm,
  },
  noticeText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  recalcBtn: {
    marginTop: spacing.xl,
  },
});
