/**
 * 理财计算器：活期理财收益测算（七日年化 / 万份收益 双口径）
 */
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { WEALTH_ANNUAL_PRESETS, WEALTH_DAY_PRESETS, WEALTH_WANFEN_PRESETS } from '../data/tools';
import { calcWealth, validateWealthInput, type WealthMode } from '../utils/wealth';
import { fmtAmountInput, fmtYuanDecimal, parseAmount, sanitizeRateInput } from '../utils/format';
import { NumberPresetModal } from '../components/NumberPresetModal';
import { InfoModal } from '../components/InfoModal';
import { AlertIcon, BackIcon, ChevronRightIcon, InfoIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const MODES: { key: WealthMode; label: string }[] = [
  { key: 'annualized', label: '七日年化' },
  { key: 'wanfen', label: '万份收益' },
];

const CALC_INFO =
  '活期理财收益按「单利、按日计息」测算，可选两种常见口径：\n\n' +
  '· 七日年化：收益 = 本金 × 七日年化收益率 ÷ 365 × 持有天数；\n' +
  '· 万份收益：收益 = 本金 ÷ 10000 × 每万份收益 × 持有天数。\n\n' +
  '七日年化收益率是过去 7 天收益折算出的年化水平；每万份收益是每 1 万元份额当日的实际收益。二者都会随净值波动，不代表未来收益。\n\n' +
  '参考日收益 = 总测算收益 ÷ 持有天数，用于粗略估算每天到账金额。\n\n' +
  '测算结果为估算值，实际收益以产品净值、万份收益变动与银行/平台结算规则为准。';

export const FinancialCalculatorScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [principalText, setPrincipalText] = useState('');
  const [mode, setMode] = useState<WealthMode>('annualized');
  const [annualText, setAnnualText] = useState('3.00');
  const [wanfenText, setWanfenText] = useState('1.50');
  const [days, setDays] = useState(365);

  const [annualModalVisible, setAnnualModalVisible] = useState(false);
  const [wanfenModalVisible, setWanfenModalVisible] = useState(false);
  const [daysModalVisible, setDaysModalVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const principal = parseAmount(principalText);
  const annualRate = parseFloat(annualText) || 0;
  const wanfenIncome = parseFloat(wanfenText) || 0;

  const hasInput = principal > 0 && days > 0 && (mode === 'annualized' ? annualRate > 0 : wanfenIncome > 0);
  const error = validateWealthInput({ principal, mode, annualRate, wanfenIncome, days });
  const showError = !!error && (principalText.length > 0 || annualRate > 30 || wanfenIncome > 100);

  const result = useMemo(
    () => calcWealth({ principal, mode, annualRate, wanfenIncome, days }),
    [principal, mode, annualRate, wanfenIncome, days],
  );

  const isAnnual = mode === 'annualized';

  return (
    <LinearGradient colors={['#F7F9F8', '#EEF2F1']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setInfoVisible(true)}>
          <InfoIcon size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heroTitle}>活期理财收益计算器</Text>
        <Text style={styles.heroSubtitle}>输入本金、收益率和天数，快速估算理财收益</Text>

        {/* 输入信息 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>输入信息</Text>
            <Text style={styles.required}>* 必填</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>本金（元）</Text>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={principalText}
              onChangeText={(text) => setPrincipalText(fmtAmountInput(text))}
              placeholder="请输入本金金额"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="number-pad"
              maxLength={13}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>计算方式</Text>
            <View style={styles.segmentWrap}>
              {MODES.map((item) => {
                const active = mode === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    style={[styles.segment, active && styles.segmentActive]}
                    onPress={() => setMode(item.key)}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 七日年化 */}
          <View style={styles.fieldRow}>
            <Text style={[styles.label, !isAnnual && styles.labelInactive]}>七日年化收益率（%）</Text>
            <View style={[styles.fieldContent, !isAnnual && styles.contentInactive]}>
              <View style={[styles.input, styles.fieldInput]}>
                <TextInput
                  style={styles.inlineInput}
                  value={annualText}
                  onChangeText={(text) => setAnnualText(sanitizeRateInput(text))}
                  onFocus={() => setMode('annualized')}
                  placeholder="3.00"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.unit}>%</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.presetBtn}
                onPress={() => setAnnualModalVisible(true)}
              >
                <Text style={styles.presetBtnText}>常用收益率</Text>
              </Pressable>
            </View>
          </View>

          {/* 万份收益 */}
          <View style={styles.fieldRow}>
            <Text style={[styles.label, isAnnual && styles.labelInactive]}>每万份收益（元）</Text>
            <View style={[styles.fieldContent, isAnnual && styles.contentInactive]}>
              <View style={[styles.input, styles.fieldInput]}>
                <TextInput
                  style={styles.inlineInput}
                  value={wanfenText}
                  onChangeText={(text) => setWanfenText(sanitizeRateInput(text, 6))}
                  onFocus={() => setMode('wanfen')}
                  placeholder="1.50"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
                <Text style={styles.unit}>元</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.presetBtn}
                onPress={() => setWanfenModalVisible(true)}
              >
                <Text style={styles.presetBtnText}>常用万份收益</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.fieldRow, styles.fieldRowLast]}>
            <Text style={styles.label}>持有天数</Text>
            <Pressable
              accessibilityRole="button"
              style={[styles.input, styles.inputFlex, styles.daysInput]}
              onPress={() => setDaysModalVisible(true)}
            >
              <Text style={styles.daysText}>{days}</Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </Pressable>
          </View>
          <Text style={styles.rowHint}>按起息日至到期日计算</Text>
        </View>

        {showError ? <Text style={styles.errorHint}>{error}</Text> : null}

        {/* 测算结果 */}
        <LinearGradient
          colors={['#E7F7F1', '#F2FBF7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>测算结果</Text>
            <Text style={styles.resultTag}>{isAnnual ? '七日年化' : '万份收益'}</Text>
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>总测算收益</Text>
              <Text
                style={[styles.resultValue, !hasInput && styles.resultValueMuted]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
              >
                {fmtYuanDecimal(result.income)}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>本息合计</Text>
              <Text
                style={[styles.resultValue, !hasInput && styles.resultValueMuted]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
              >
                {fmtYuanDecimal(result.total)}
              </Text>
            </View>
          </View>

          <View style={styles.dashed} />

          <View style={styles.dailyRow}>
            <Text style={styles.dailyLabel}>参考日收益</Text>
            <Text style={styles.dailyValue}>{fmtYuanDecimal(result.dailyIncome)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.disclaimerRow}>
          <AlertIcon size={13} color={colors.textTertiary} />
          <Text style={styles.disclaimer}>理财收益为测算值，实际以净值 / 万份收益变动为准</Text>
        </View>
      </ScrollView>

      <NumberPresetModal
        key={annualModalVisible ? `annual-${annualRate}` : 'annual-closed'}
        visible={annualModalVisible}
        title="常用收益率"
        value={annualRate}
        presets={WEALTH_ANNUAL_PRESETS}
        suffix="%"
        decimals={2}
        max={30}
        hint="收益率随市场波动，请以产品页面展示的最新数据为准"
        onClose={() => setAnnualModalVisible(false)}
        onConfirm={(value) => {
          setAnnualText(value.toFixed(2));
          setMode('annualized');
        }}
      />
      <NumberPresetModal
        key={wanfenModalVisible ? `wanfen-${wanfenIncome}` : 'wanfen-closed'}
        visible={wanfenModalVisible}
        title="常用万份收益"
        value={wanfenIncome}
        presets={WEALTH_WANFEN_PRESETS}
        suffix="元"
        decimals={2}
        max={100}
        hint="万份收益每日更新，请以产品页面展示的最新数据为准"
        onClose={() => setWanfenModalVisible(false)}
        onConfirm={(value) => {
          setWanfenText(value.toFixed(2));
          setMode('wanfen');
        }}
      />
      <NumberPresetModal
        key={daysModalVisible ? `days-${days}` : 'days-closed'}
        visible={daysModalVisible}
        title="持有天数"
        value={days}
        presets={WEALTH_DAY_PRESETS}
        suffix="天"
        decimals={0}
        max={3650}
        hint="持有天数按起息日至到期日（或赎回日）计算，最多 3650 天"
        onClose={() => setDaysModalVisible(false)}
        onConfirm={(value) => setDays(value)}
      />
      <InfoModal visible={infoVisible} title="计算说明" content={CALC_INFO} onClose={() => setInfoVisible(false)} />
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  /* 标题区 */
  heroTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },

  /* 输入卡 */
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
  },
  required: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  fieldRowLast: {
    marginBottom: 2,
  },
  label: {
    width: 132,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3A36',
  },
  labelInactive: {
    color: colors.textTertiary,
  },
  input: {
    height: 46,
    backgroundColor: '#F3F5F5',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    fontSize: fontSize.normal,
    color: colors.textStrong,
  },
  inputFlex: {
    flex: 1,
  },
  fieldContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contentInactive: {
    opacity: 0.5,
  },
  fieldInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inlineInput: {
    flex: 1,
    fontSize: fontSize.normal,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  unit: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  presetBtn: {
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: '#DCEFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: fontSize.mini,
    fontWeight: '700',
    color: colors.primary,
  },

  /* 计算方式 */
  segmentWrap: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E6EDEA',
    backgroundColor: '#FBFCFC',
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: fontSize.normal,
    color: '#2C3A36',
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  daysInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daysText: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  rowHint: {
    marginTop: 6,
    marginRight: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  errorHint: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.red,
  },

  /* 结果卡 */
  resultCard: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CDE9DE',
    padding: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
  },
  resultTag: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: '#4F8C7A',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.md,
  },
  resultCell: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  resultDivider: {
    width: spacing.sm,
  },
  resultLabel: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  resultValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  resultValueMuted: {
    color: '#9FB8AF',
  },
  dashed: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#BEDCCF',
    borderStyle: 'dashed',
  },
  dailyRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyLabel: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.text,
  },
  dailyValue: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.primary,
  },
  disclaimerRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disclaimer: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
});
