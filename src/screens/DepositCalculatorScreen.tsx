/**
 * 存款计算器：定期存款（整存整取）单利测算
 * 按设计稿实现：输入信息卡 → 测算结果卡 → 计息方式说明
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
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import { calcDeposit, validateDepositInput, type DateParts, type DepositTerm } from '../utils/deposit';
import { fmtAmountInput, fmtDateISO, fmtYuanDecimal, parseAmount, sanitizeRateInput } from '../utils/format';
import { MonthPickerModal } from '../components/MonthPickerModal';
import { DepositRateModal } from '../components/DepositRateModal';
import { InfoModal } from '../components/InfoModal';
import { useCalcCommitOnLeave, useCalcDirty } from '../hooks/useCalcRecord';
import { BackIcon, CalendarIcon, ChevronRightIcon, InfoIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const CALC_INFO =
  '本工具按「单利」测算定期存款（整存整取）的到期收益：\n\n' +
  '· 利息 = 本金 × 年利率 × 存款年数 + 本金 × 日利率 × 零头天数；\n' +
  '· 日利率 = 年利率 ÷ 360，零头天数 = 月 × 30 + 天；\n' +
  '· 到期日按开户日「对年对月对日」推算，月末不足时取当月最后一天。\n\n' +
  '存期内如遇利率调整，已存入的定期存款仍按开户日利率执行，到期一次性还本付息。\n\n' +
  '测算结果仅供参考，实际利息以银行执行利率与计息规则为准。';

const today = (): DateParts => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

const digitsOnly = (text: string, maxLength: number) => text.replace(/\D/g, '').slice(0, maxLength);

export const DepositCalculatorScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [principalText, setPrincipalText] = useState('');
  const [yearsText, setYearsText] = useState('1');
  const [monthsText, setMonthsText] = useState('0');
  const [daysText, setDaysText] = useState('0');
  const [startDate, setStartDate] = useState<DateParts>(today);
  const [rateText, setRateText] = useState('1.55');

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const principal = parseAmount(principalText);
  const years = parseInt(yearsText, 10) || 0;
  const months = parseInt(monthsText, 10) || 0;
  const days = parseInt(daysText, 10) || 0;
  const term: DepositTerm = { years, months, days };
  const rate = parseFloat(rateText) || 0;

  const hasInput = principal > 0 && (years > 0 || months > 0 || days > 0) && rate > 0;
  const error = validateDepositInput({ principal, term, start: startDate, annualRate: rate });
  const showError = !!error && (principalText.length > 0 || rate > 24);

  const result = useMemo(
    () => calcDeposit({ principal, term: { years, months, days }, start: startDate, annualRate: rate }),
    [principal, years, months, days, startDate, rate],
  );

  // 实时计算：改动过参数后离开页面才算用了一次
  const depositDirty = useCalcDirty(
    `${principalText}|${yearsText}|${monthsText}|${daysText}|${startDate.year}-${startDate.month}-${startDate.day}|${rateText}`,
  );
  useCalcCommitOnLeave(
    'deposit',
    hasInput && !error
      ? `本金 ¥${principalText} · ${years}年${months}月${days}日 · ${rateText}%`
      : null,
    depositDirty,
  );

  const renderTermField = (
    value: string,
    onChange: (text: string) => void,
    unit: string,
    placeholder: string,
  ) => (
    <View style={styles.termGroup}>
      <TextInput
        style={styles.termInput}
        value={value}
        onChangeText={(text) => onChange(digitsOnly(text, 2))}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
      />
      <Text style={styles.termUnit}>{unit}</Text>
    </View>
  );

  return (
    <LinearGradient colors={[colors.screenFrom, colors.screenTo]} style={styles.container}>
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
        {/* 标题区 */}
        <Text style={styles.heroTitle}>定期存款计算器</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>银行定期</Text>
          <View style={styles.badgeDivider} />
          <Text style={styles.badgeText}>单利测算</Text>
        </View>
        <Text style={styles.heroSubtitle}>输入本金、期限、日期和利率，快速估算到期利息</Text>

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
            <Text style={styles.label}>存款期限</Text>
            <View style={styles.termRow}>
              {renderTermField(yearsText, setYearsText, '年', '0')}
              {renderTermField(monthsText, setMonthsText, '月', '0')}
              {renderTermField(daysText, setDaysText, '天', '0')}
            </View>
          </View>
          <Text style={styles.termHint}>按开户日计算</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>存款日期</Text>
            <Pressable
              accessibilityRole="button"
              style={[styles.input, styles.inputFlex, styles.dateInput]}
              onPress={() => setDatePickerVisible(true)}
            >
              <CalendarIcon size={18} color={colors.primary} />
              <Text style={styles.dateText}>
                {fmtDateISO(startDate.year, startDate.month, startDate.day)}
              </Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </Pressable>
          </View>

          <View style={[styles.fieldRow, styles.fieldRowLast]}>
            <Text style={styles.label}>存款利率（%）</Text>
            <View style={styles.rateRow}>
              <View style={[styles.input, styles.rateInputWrap]}>
                <TextInput
                  style={styles.rateInput}
                  value={rateText}
                  onChangeText={(text) => setRateText(sanitizeRateInput(text))}
                  placeholder="1.55"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.rateUnit}>%</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.presetBtn}
                onPress={() => setRateModalVisible(true)}
              >
                <Text style={styles.presetBtnText}>常用利率</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {showError ? <Text style={styles.errorHint}>{error}</Text> : null}

        {/* 测算结果 */}
        <LinearGradient
          colors={[colors.mintFrom, colors.mintTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>测算结果</Text>
            <Text style={styles.resultTag}>单利</Text>
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>利息收益</Text>
              <Text
                style={[styles.resultValue, !hasInput && styles.resultValueMuted]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
              >
                {fmtYuanDecimal(result.interest)}
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

          <View style={styles.resultMetaRow}>
            <Text style={styles.resultMeta}>
              到期日 {fmtDateISO(result.maturity.year, result.maturity.month, result.maturity.day)}
            </Text>
            <Text style={styles.resultMeta}>计息天数 {result.calendarDays} 天</Text>
          </View>
        </LinearGradient>

        {/* 计息方式 */}
        <View style={styles.formulaCard}>
          <Text style={styles.formulaTitle}>计息方式：单利（定期整存整取）</Text>
          <Text style={styles.formulaLine}>利息 = 本金 × 年利率 × 存款年数 + 本金 × 日利率 × 零头天数</Text>
          <Text style={styles.formulaLine}>
            本次存期 {term.years} 年 {term.months} 月 {term.days} 天，零头 {result.oddDays} 天，折算{' '}
            {result.effectiveYears.toFixed(4)} 年
          </Text>
          <Text style={styles.formulaLine}>存期内遇利率调整，仍按开户日利率执行</Text>
        </View>

        <Text style={styles.disclaimer}>本工具仅作测算参考，实际利息以银行执行利率和规则为准</Text>
      </ScrollView>

      <MonthPickerModal
        key={datePickerVisible ? `deposit-date-${startDate.year}-${startDate.month}-${startDate.day}` : 'deposit-date-closed'}
        visible={datePickerVisible}
        year={startDate.year}
        month={startDate.month}
        day={startDate.day}
        title="选择存款日期"
        tip="到期日按开户日 + 存期推算（对年对月对日）"
        minYear={2000}
        maxYear={2050}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(year, month, day) => setStartDate({ year, month, day })}
      />
      <DepositRateModal
        key={rateModalVisible ? `deposit-rate-${rate}` : 'deposit-rate-closed'}
        visible={rateModalVisible}
        rate={rate || 1.55}
        onClose={() => setRateModalVisible(false)}
        onConfirm={(value) => setRateText(String(value))}
      />
      <InfoModal visible={infoVisible} title="计算说明" content={CALC_INFO} onClose={() => setInfoVisible(false)} />
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  /* 标题区 */
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: '#DCEFE8',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 26,
  },
  badgeText: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
  },
  badgeDivider: {
    width: 1,
    height: 10,
    marginHorizontal: spacing.sm,
    backgroundColor: '#A8CFC1',
  },
  heroSubtitle: {
    marginTop: spacing.md,
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
    marginBottom: spacing.xs,
  },
  label: {
    width: 94,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: '#2C3A36',
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
  termRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  termGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  termInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F3F5F5',
    borderRadius: radius.sm,
    textAlign: 'center',
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  termUnit: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  termHint: {
    marginTop: 6,
    marginRight: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  rateRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rateInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  rateInput: {
    flex: 1,
    fontSize: fontSize.normal,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  rateUnit: {
    fontSize: fontSize.normal,
    color: colors.textSecondary,
  },
  presetBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: '#DCEFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.primary,
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
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  resultMeta: {
    fontSize: fontSize.mini,
    color: '#5F8A7C',
  },

  /* 计息方式 */
  formulaCard: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#A6D8C6',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  formulaTitle: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.text,
  },
  formulaLine: {
    fontSize: fontSize.mini,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  disclaimer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  errorHint: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.red,
  },
});
