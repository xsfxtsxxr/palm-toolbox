/**
 * 个税计算器：工资薪金累计预扣法测算
 * 按设计稿实现：月薪 / 五险一金 / 专项附加扣除 → 全年明细
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import { calcTax, validateTaxInput } from '../utils/tax';
import { fmtAmountInput, fmtMoney, parseAmount } from '../utils/format';
import { PrimaryButton } from '../components/PrimaryButton';
import { InfoModal } from '../components/InfoModal';
import { useToast } from '../components/Toast';
import { useCalcRecorder } from '../hooks/useCalcRecord';
import { BackIcon, InfoIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const CALC_INFO =
  '工资薪金个税按「累计预扣法」逐月预扣预缴：\n\n' +
  '累计应纳税所得额 = 累计收入 − 5,000 × 月份数 − 累计五险一金 − 累计专项附加扣除\n\n' +
  '本月应扣税 = 累计应纳税所得额 × 预扣率 − 速算扣除数 − 累计已扣税（结果小于 0 时按 0 计，差额留待年度汇算清缴）\n\n' +
  '预扣率表（累计应纳税所得额）：\n' +
  '· 不超过 36,000 元：3%，速算扣除 0\n' +
  '· 36,000 - 144,000 元：10%，速算扣除 2,520\n' +
  '· 144,000 - 300,000 元：20%，速算扣除 16,920\n' +
  '· 300,000 - 420,000 元：25%，速算扣除 31,920\n' +
  '· 420,000 - 660,000 元：30%，速算扣除 52,920\n' +
  '· 660,000 - 960,000 元：35%，速算扣除 85,920\n' +
  '· 超过 960,000 元：45%，速算扣除 181,920\n\n' +
  '专项附加扣除含子女教育、3 岁以下婴幼儿照护、继续教育、大病医疗、住房贷款利息、住房租金、赡养老人 7 项，按月度可扣除金额合计填写。\n\n' +
  '本工具仅测算工资薪金所得，不含年终奖、劳务报酬、稿酬、经营所得等，也未考虑减免税额与年度汇算清缴结果。';

export const TaxCalculatorScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { commit: commitCalc } = useCalcRecorder('tax');

  const [salaryText, setSalaryText] = useState('');
  const [insuranceText, setInsuranceText] = useState('');
  const [specialText, setSpecialText] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);

  const input = {
    monthlySalary: parseAmount(salaryText),
    insurance: parseAmount(insuranceText),
    specialDeduction: parseAmount(specialText),
  };

  const handleCalc = () => {
    const error = validateTaxInput(input);
    if (error) {
      showToast(error);
      return;
    }
    navigation.navigate('TaxDetail', { result: calcTax(input) });
    commitCalc(`月薪 ¥${fmtMoney(input.monthlySalary)}`);
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => onChange(fmtAmountInput(text))}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="number-pad"
          maxLength={13}
        />
        <Text style={styles.unit}>元</Text>
      </View>
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
        <Text style={styles.heroTitle}>个税计算器</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>工资薪金</Text>
          <View style={styles.badgeDivider} />
          <Text style={styles.badgeText}>累计预扣法</Text>
        </View>
        <Text style={styles.heroSubtitle}>输入月薪与各项扣除，测算全年个税和各月到手工资</Text>

        {/* 输入信息 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>输入信息</Text>
            <Text style={styles.required}>* 必填</Text>
          </View>

          {renderField('月薪', salaryText, setSalaryText, '请输入月薪')}
          {renderField('五险一金个人部分', insuranceText, setInsuranceText, '请输入五险一金')}
          {renderField('专项附加扣除减免金额', specialText, setSpecialText, '请输入专项附加扣除减免金额')}

          <Text style={styles.fieldHint}>
            五险一金按个人每月实际缴纳金额填写；专项附加扣除为子女教育、房贷利息、赡养老人等 7 项的月度合计
          </Text>

          <PrimaryButton title="开始计算" onPress={handleCalc} style={styles.calcBtn} />
        </View>

        {/* 计算规则 */}
        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <View style={styles.ruleBar} />
            <Text style={styles.ruleTitle}>计算规则</Text>
          </View>
          <Text style={styles.ruleLine}>
            <Text style={styles.ruleStrong}>累计应纳税所得额</Text> = 累计收入 − 5,000 × 月数 − 五险一金 − 专项附加扣除
          </Text>
          <Text style={styles.ruleLine}>
            <Text style={styles.ruleStrong}>本月个税</Text> = 累计应纳税所得额 × 预扣率 − 速算扣除数 − 已预扣税额
          </Text>
          <Text style={styles.ruleLine}>
            <Text style={styles.ruleStrong}>到手工资</Text> = 月薪 − 五险一金 − 本月个税
          </Text>
          <Text style={styles.ruleTip}>起征点 5,000 元 / 月，税率 3% - 45% 七级超额累进</Text>
        </View>

        <Text style={styles.disclaimer}>测算结果仅供参考，实际税额以扣缴单位申报与税务机关核定为准</Text>
      </ScrollView>

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
    paddingBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  field: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: '#2C3A36',
    marginBottom: spacing.sm,
  },
  inputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F5F5',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: fontSize.normal,
    color: colors.textStrong,
  },
  unit: {
    marginLeft: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  fieldHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
  },
  calcBtn: {
    marginTop: spacing.xl,
  },

  /* 计算规则 */
  ruleCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ruleBar: {
    width: 3,
    height: 15,
    borderRadius: 2,
    marginRight: spacing.sm,
    backgroundColor: colors.primary,
  },
  ruleTitle: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.primary,
  },
  ruleLine: {
    marginTop: 6,
    fontSize: fontSize.body,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  ruleStrong: {
    fontWeight: '700',
    color: '#2C3A36',
  },
  ruleTip: {
    marginTop: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  disclaimer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
