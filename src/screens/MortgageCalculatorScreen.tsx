/**
 * 房贷计算器（提前还款测算）输入页
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import type { MortgageInput, PrepayMode } from '../types';
import { calcMortgage, getRemainingPaymentInfo, validateInput } from '../utils/mortgage';
import { fmtAmountInput, fmtPercent, fmtYuan, formatYearMonthCN, nextYearMonth, parseAmount } from '../utils/format';
import { PrimaryButton } from '../components/PrimaryButton';
import { MonthPickerModal } from '../components/MonthPickerModal';
import { RatePickerModal } from '../components/RatePickerModal';
import { PeriodPickerModal } from '../components/PeriodPickerModal';
import { InfoModal } from '../components/InfoModal';
import { GradientAmountText } from '../components/icons/ToolIcons';
import { BackIcon, CalendarIcon, ChevronRightIcon, InfoIcon, ShieldCheckIcon } from '../components/icons/UIIcons';
import { useToast } from '../components/Toast';
import { useCalculations } from '../context/CalculationContext';
import { useCalcRecorder } from '../hooks/useCalcRecord';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const MODES: { key: PrepayMode; label: string; hint: string }[] = [
  { key: 'reducePayment', label: '减少月供', hint: '期限不变，每月还款减少' },
  { key: 'reduceTerm', label: '缩短期限', hint: '月供不变，更快还清贷款' },
];

const CALC_INFO =
  '等额本息：每月还款额固定，由本金与利息两部分组成，前期利息占比高、后期本金占比高。\n\n提前还款后提供两种方式：\n· 减少月供 —— 保持剩余期限不变，按剩余本金重新计算月供；\n· 缩短期限 —— 保持月供不变，反解新的还款期数。\n\n测算结果仅供参考，实际以贷款合同与银行核算为准。';

export const MortgageCalculatorScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { addResult } = useCalculations();
  const { commit: commitCalc } = useCalcRecorder('mortgage');

  const [principalText, setPrincipalText] = useState('');
  const [prepayText, setPrepayText] = useState('');
  const [date, setDate] = useState(nextYearMonth);
  const [paymentDay, setPaymentDay] = useState(15);
  const [totalMonthsText, setTotalMonthsText] = useState('360');
  const [rate, setRate] = useState(4.9);
  const [customMonths, setCustomMonths] = useState<number | null>(null);
  const [mode, setMode] = useState<PrepayMode>('reducePayment');

  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [ratePickerVisible, setRatePickerVisible] = useState(false);
  const [periodPickerVisible, setPeriodPickerVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const principal = parseAmount(principalText);
  const prepay = parseAmount(prepayText);
  const totalMonths = parseInt(totalMonthsText, 10) || 0;
  const autoPeriod = useMemo(
    () => getRemainingPaymentInfo({ year: date.year, month: date.month, day: paymentDay }, totalMonths),
    [date.year, date.month, paymentDay, totalMonths],
  );
  const months = customMonths ?? autoPeriod.remainingMonths;
  const valid = principal > 0 && prepay > 0 && prepay < principal;

  // 实时预览：输入合法即测算节省利息
  const preview = useMemo(() => {
    if (!valid) return null;
    const input: MortgageInput = {
      remainingPrincipal: principal,
      prepayAmount: prepay,
      firstPaymentYear: date.year,
      firstPaymentMonth: date.month,
      firstPaymentDay: paymentDay,
      totalMonths,
      annualRate: rate,
      remainingMonths: months,
      mode,
    };
    return calcMortgage(input);
  }, [valid, principal, prepay, date.year, date.month, paymentDay, totalMonths, rate, months, mode]);

  const handleCalculate = () => {
    const error = validateInput({ remainingPrincipal: principal, prepayAmount: prepay });
    if (error) {
      showToast(error);
      return;
    }
    if (totalMonths <= 0 || totalMonths > 600) {
      showToast('请输入有效的贷款总期数（1-600个月）');
      return;
    }
    if (months <= 0) {
      showToast('剩余期数需大于0，可手动调整');
      return;
    }
    if (!preview) return;
    addResult(preview);
    commitCalc(`剩余本金 ${principal} 万 · 剩余 ${totalMonths} 期`);
    navigation.navigate('RepaymentPlan', { result: preview });
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>房贷计算器</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setInfoVisible(true)}>
          <InfoIcon size={22} color={colors.textStrong} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 表单卡片 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>剩余贷款总额</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={principalText}
                onChangeText={(text) => setPrincipalText(fmtAmountInput(text))}
                placeholder="请输入金额"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="number-pad"
                maxLength={13}
              />
              <Text style={styles.unit}>元</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>提前偿还金额</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={prepayText}
                onChangeText={(text) => setPrepayText(fmtAmountInput(text))}
                placeholder="请输入金额"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="number-pad"
                maxLength={13}
              />
              <Text style={styles.unit}>元</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Pressable accessibilityRole="button" style={styles.formRow} onPress={() => setMonthPickerVisible(true)}>
            <Text style={styles.formLabel}>首次还款日期</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.valueText}>
                {date.year}.{String(date.month).padStart(2, '0')}.{String(paymentDay).padStart(2, '0')}
              </Text>
              <CalendarIcon size={18} color={colors.primary} />
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>贷款总期数</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={totalMonthsText}
                onChangeText={(text) => {
                  setTotalMonthsText(text.replace(/\D/g, '').slice(0, 3));
                  setCustomMonths(null);
                }}
                placeholder="请输入总期数"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.unit}>月</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Pressable accessibilityRole="button" style={styles.formRow} onPress={() => setRatePickerVisible(true)}>
            <Text style={styles.formLabel}>贷款年利率</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.valueText}>{fmtPercent(rate)}</Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable accessibilityRole="button" style={styles.formRow} onPress={() => setPeriodPickerVisible(true)}>
            <Text style={styles.formLabel}>剩余期数（月）</Text>
            <View style={styles.valueWrap}>
              <Text style={styles.valueText}>{months}</Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* 还款方式（提前还款模式） */}
        <View style={styles.modeSection}>
          <View style={styles.modeWrap}>
            {MODES.map((item) => {
              const active = mode === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  style={[styles.modeItem, active && styles.modeItemActive]}
                  onPress={() => setMode(item.key)}
                >
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.modeHint}>
            {MODES.find((item) => item.key === mode)?.hint} · 首次还款 {formatYearMonthCN(date.year, date.month)} {paymentDay} 日
          </Text>
        </View>

        {/* 开始计算 */}
        <PrimaryButton title="开始计算" onPress={handleCalculate} />

        {/* 节省利息预览 */}
        <View style={styles.previewCard}>
          <ShieldCheckIcon size={26} color="#3E7BFA" />
          <View style={styles.previewTextWrap}>
            <Text style={styles.previewLabel}>提前还款后预计节省利息</Text>
            {valid && preview ? (
              <GradientAmountText text={fmtYuan(preview.savedInterest)} size={22} width={230} />
            ) : (
              <Text style={styles.previewPlaceholder}>填写贷款信息后实时测算</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 选择器弹窗 */}
      <MonthPickerModal
        key={monthPickerVisible ? `month-${date.year}-${date.month}-${paymentDay}` : 'month-closed'}
        visible={monthPickerVisible}
        year={date.year}
        month={date.month}
        day={paymentDay}
        onClose={() => setMonthPickerVisible(false)}
        onConfirm={(year, month, day) => {
          setDate({ year, month });
          setPaymentDay(day);
          setCustomMonths(null);
        }}
      />
      <RatePickerModal
        visible={ratePickerVisible}
        rate={rate}
        onClose={() => setRatePickerVisible(false)}
        onConfirm={(value) => setRate(value)}
      />
      <PeriodPickerModal
        key={periodPickerVisible ? `period-${months}` : 'period-closed'}
        visible={periodPickerVisible}
        months={months}
        onClose={() => setPeriodPickerVisible(false)}
        onConfirm={(value) => setCustomMonths(value)}
      />
      <InfoModal visible={infoVisible} title="计算说明" content={CALC_INFO} onClose={() => setInfoVisible(false)} />
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
    backgroundColor: colors.background,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
  },
  formRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formLabel: {
    fontSize: fontSize.normal,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  input: {
    minWidth: 110,
    textAlign: 'right',
    fontSize: fontSize.normal,
    color: colors.textStrong,
    paddingVertical: 4,
  },
  unit: {
    fontSize: fontSize.body,
    color: colors.textTertiary,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  valueText: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  modeSection: {
    marginTop: spacing.lg,
  },
  modeWrap: {
    flexDirection: 'row',
    backgroundColor: '#E9EDF3',
    borderRadius: radius.md,
    padding: 3,
  },
  modeItem: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeItemActive: {
    backgroundColor: colors.card,
    ...shadow.card,
  },
  modeText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modeHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  previewCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewTextWrap: {
    flex: 1,
  },
  previewLabel: {
    fontSize: fontSize.body,
    color: '#5B6B85',
  },
  previewPlaceholder: {
    marginTop: 6,
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: '#9AA9C4',
  },
});
