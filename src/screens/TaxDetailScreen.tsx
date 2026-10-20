/**
 * 年度扣税明细：年度汇总（累计收入 / 扣税 / 到手 / 月均）+ 逐月扣税表 + 导出
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, spacing } from '../theme/theme';
import { fmtPercent, fmtYuan, fmtYuanDecimal } from '../utils/format';
import { TaxTable } from '../components/TaxTable';
import { PrimaryButton } from '../components/PrimaryButton';
import { InfoModal } from '../components/InfoModal';
import { useToast } from '../components/Toast';
import {
  BackIcon,
  CoinsIcon,
  ExportIcon,
  InfoIcon,
  MoneyBagIcon,
  ShieldCheckIcon,
  WalletIcon,
} from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TaxDetail'>;

const DETAIL_INFO =
  '本页按「累计预扣法」逐月测算工资薪金的预扣预缴税额：\n\n' +
  '· 累计应纳税所得额 = 累计收入 − 5,000 × 月份数 − 累计五险一金 − 累计专项附加扣除；\n' +
  '· 本月扣税 = 累计应纳税所得额 × 预扣率 − 速算扣除数 − 累计已扣税，负数按 0 计；\n' +
  '· 到手工资 = 月薪 − 五险一金 − 本月扣税。\n\n' +
  '随着累计所得额跨档，税率由 3% 逐级升至 45%，因此月薪不变时，月扣税会在跨档月份跳升，到手工资相应减少。\n\n' +
  '测算假设全年收入、五险一金和专项附加扣除每月相同，不含年终奖、劳务报酬、稿酬、经营所得，也未考虑减免税额与年度汇算清缴。实际税额以扣缴单位申报与税务机关核定为准。';

export const TaxDetailScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const { result } = route.params;
  const [infoVisible, setInfoVisible] = useState(false);

  const handleExport = async () => {
    const header = '月份,税前月薪,五险一金,本月扣税,累计扣税,到手工资';
    const lines = result.schedule.map((row) =>
      [
        `${row.month}月`,
        result.input.monthlySalary.toFixed(2),
        result.input.insurance.toFixed(2),
        row.tax.toFixed(2),
        row.cumulativeTax.toFixed(2),
        row.netIncome.toFixed(2),
      ].join(','),
    );
    const csv = [header, ...lines].join('\n');
    try {
      await Share.share({ message: csv, title: '年度扣税明细' });
    } catch {
      showToast('导出失败，请稍后重试');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>个税计算器</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setInfoVisible(true)}>
          <InfoIcon size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 年度汇总 */}
        <LinearGradient
          colors={['#12604F', '#0B3F35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryPanel}
        >
          <Text style={styles.panelTitle}>年度扣税明细</Text>
          <Text style={styles.panelSubtitle}>
            月薪 {fmtYuan(result.input.monthlySalary)} · 五险一金 {fmtYuan(result.input.insurance)} ·
            专项附加 {fmtYuan(result.input.specialDeduction)}
          </Text>

          <View style={styles.statGrid}>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>累计收入</Text>
                <View style={styles.statIcon}>
                  <MoneyBagIcon size={22} color={colors.primary} />
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {fmtYuan(result.annualIncome)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>累计扣税总额</Text>
                <View style={styles.statIcon}>
                  <ShieldCheckIcon size={22} color={colors.primary} />
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {fmtYuan(result.annualTax)}
                </Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>税后到手总额</Text>
                <View style={styles.statIcon}>
                  <WalletIcon size={22} color={colors.primary} />
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {fmtYuan(result.annualNet)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>月均扣税</Text>
                <View style={styles.statIcon}>
                  <CoinsIcon size={22} color={colors.primary} />
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {fmtYuan(result.monthlyAverageTax)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.panelFooter}>
            <View style={styles.footerCell}>
              <Text style={styles.footerLabel}>实际税负</Text>
              <Text style={styles.footerValue}>{fmtPercent(result.effectiveRate)}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerCell}>
              <Text style={styles.footerLabel}>全年应纳税所得额</Text>
              <Text style={styles.footerValue}>{fmtYuanDecimal(result.annualTaxable)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 逐月明细 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>每月扣税明细</Text>
          <Pressable accessibilityRole="button" style={styles.exportBtn} onPress={handleExport}>
            <ExportIcon size={14} color={colors.primary} />
            <Text style={styles.exportText}>导出</Text>
          </Pressable>
        </View>

        <TaxTable result={result} />

        <Text style={styles.note}>
          跨档月份税率跳升，本月扣税会明显增加、到手工资相应减少，属正常现象。实际税额以单位申报与税务机关核定为准。
        </Text>

        <PrimaryButton title="重新测算" onPress={() => navigation.goBack()} style={styles.recalcBtn} />
      </ScrollView>

      <InfoModal
        visible={infoVisible}
        title="数据说明"
        content={DETAIL_INFO}
        onClose={() => setInfoVisible(false)}
      />
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

  /* 年度汇总面板 */
  summaryPanel: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
  },
  panelTitle: {
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },
  panelSubtitle: {
    marginTop: 6,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.72)',
  },
  statGrid: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  statIcon: {
    marginTop: spacing.sm,
    height: 30,
    justifyContent: 'center',
  },
  statValue: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  panelFooter: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    paddingTop: spacing.md,
  },
  footerCell: {
    flex: 1,
  },
  footerDivider: {
    width: 1,
    height: 26,
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  footerLabel: {
    fontSize: fontSize.caption,
    color: 'rgba(255,255,255,0.66)',
  },
  footerValue: {
    marginTop: 3,
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.white,
  },

  /* 明细 */
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
  note: {
    marginTop: spacing.md,
    fontSize: fontSize.mini,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  recalcBtn: {
    marginTop: spacing.xl,
  },
});
