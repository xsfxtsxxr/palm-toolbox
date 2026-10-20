/**
 * 单位换算：长度 / 重量常用单位互转
 * 实时换算，支持单位互换与常用换算组合快捷切换
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  CATEGORY_META,
  QUICK_PAIRS,
  UNITS,
  convertUnit,
  findUnit,
  fmtUnitValue,
  unitRate,
  type UnitCategory,
} from '../utils/unit';
import { fmtDecimalInput, parseMoney } from '../utils/format';
import { UnitPickerModal } from '../components/UnitPickerModal';
import { InfoModal } from '../components/InfoModal';
import { useCalcCommitOnLeave, useCalcDirty } from '../hooks/useCalcRecord';
import { BackIcon, ChevronRightIcon, InfoIcon, SwapIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: { key: UnitCategory; label: string }[] = [
  { key: 'length', label: '长度' },
  { key: 'weight', label: '重量' },
];

const CALC_INFO =
  '长度与重量单位均按精确定义值换算：\n\n' +
  '长度（基准：厘米）\n' +
  '· 1 英寸 = 2.54 厘米\n' +
  '· 1 英尺 = 30.48 厘米 = 12 英寸\n' +
  '· 1 码 = 91.44 厘米 = 3 英尺\n' +
  '· 1 尺（市尺）= 1/3 米 ≈ 33.3333 厘米\n' +
  '· 1 海里 = 1.852 千米\n' +
  '· 1 英里 = 1.609344 千米\n\n' +
  '重量（基准：克）\n' +
  '· 1 盎司 = 28.349523125 克\n' +
  '· 1 磅 = 453.59237 克\n' +
  '· 1 克拉 = 0.2 克\n' +
  '· 1 斤（市斤）= 500 克\n\n' +
  '换算结果按量级保留 2 - 6 位小数并去掉末尾 0，仅供日常参考。';

export const UnitConverterScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<UnitCategory>('length');
  const [amountText, setAmountText] = useState('1');
  const [from, setFrom] = useState(CATEGORY_META.length.defaultFrom);
  const [to, setTo] = useState(CATEGORY_META.length.defaultTo);

  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const units = UNITS[category];
  const fromUnit = findUnit(category, from) ?? units[0];
  const toUnit = findUnit(category, to) ?? units[0];

  const amount = parseMoney(amountText);
  const converted = convertUnit(amount, category, from, to);
  const rate = unitRate(category, from, to);
  const inverseRate = rate > 0 ? 1 / rate : 0;

  // 实时换算：改过数值或单位后离开页面才算用了一次
  const unitDirty = useCalcDirty(`${category}|${amountText}|${from}|${to}`);
  useCalcCommitOnLeave(
    'unit',
    amount > 0 ? `${amountText} ${fromUnit.symbol} → ${toUnit.symbol}` : null,
    unitDirty,
  );

  const switchCategory = (next: UnitCategory) => {
    if (next === category) return;
    const meta = CATEGORY_META[next];
    setCategory(next);
    setFrom(meta.defaultFrom);
    setTo(meta.defaultTo);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const applyPair = (pairFrom: string, pairTo: string) => {
    setFrom(pairFrom);
    setTo(pairTo);
  };

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
        <Text style={styles.heroTitle}>单位换算</Text>
        <Text style={styles.heroSubtitle}>长度、重量常用单位快速互转</Text>

        {/* 分类切换 */}
        <View style={styles.tabBar}>
          {CATEGORIES.map((item) => {
            const active = item.key === category;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => switchCategory(item.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 换算输入 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>换算</Text>
            <Text style={styles.required}>* 必填</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>数值</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(text) => setAmountText(fmtDecimalInput(text, 4))}
                placeholder="请输入数值"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="decimal-pad"
                maxLength={18}
              />
              <Text style={styles.amountUnit}>{fromUnit.symbol}</Text>
            </View>
          </View>

          <View style={styles.unitRow}>
            <View style={styles.unitCol}>
              <Text style={styles.unitLabel}>从单位</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.select}
                onPress={() => setPicker('from')}
              >
                <View style={styles.selectText}>
                  <Text style={styles.selectSymbol}>{fromUnit.symbol}</Text>
                  <Text style={styles.selectName}>{fromUnit.name}</Text>
                </View>
                <ChevronRightIcon size={14} color={colors.textTertiary} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="互换单位"
              style={({ pressed }) => [styles.swapBtn, pressed && styles.swapBtnPressed]}
              onPress={swap}
            >
              <SwapIcon size={18} color={colors.primary} />
            </Pressable>

            <View style={styles.unitCol}>
              <Text style={styles.unitLabel}>到单位</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.select}
                onPress={() => setPicker('to')}
              >
                <View style={styles.selectText}>
                  <Text style={styles.selectSymbol}>{toUnit.symbol}</Text>
                  <Text style={styles.selectName}>{toUnit.name}</Text>
                </View>
                <ChevronRightIcon size={14} color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.hint}>输入支持 4 位小数，结果按量级保留 2 - 6 位</Text>
        </View>

        {/* 换算结果 */}
        <LinearGradient
          colors={[colors.mintFrom, colors.mintTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>换算结果</Text>
            <Text style={styles.resultTag}>
              {fromUnit.symbol} → {toUnit.symbol}
            </Text>
          </View>

          <View style={styles.valueRow}>
            <Text
              style={styles.resultNumber}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.45}
            >
              {fmtUnitValue(converted)}
            </Text>
            <Text style={styles.resultUnit}>{toUnit.name}</Text>
          </View>

          <View style={styles.rateBox}>
            <View style={styles.rateRow}>
              <Text style={styles.ratePrefix}>1 {fromUnit.symbol} =</Text>
              <Text
                style={styles.rateValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {fmtUnitValue(rate)}
              </Text>
              <Text style={styles.rateSuffix}>{toUnit.symbol}</Text>
            </View>
            <Text style={styles.inverseRate}>
              1 {toUnit.symbol} = {fmtUnitValue(inverseRate)} {fromUnit.symbol}
            </Text>
          </View>
        </LinearGradient>

        {/* 常用换算 */}
        <View style={[styles.card, styles.quickCard, shadow.card]}>
          <View style={styles.quickHeader}>
            <Text style={styles.quickTitle}>常用换算</Text>
            <Text style={styles.quickSub}>点击切换单位组合</Text>
          </View>

          {QUICK_PAIRS[category].map((pair, index) => {
            const active = pair.from === from && pair.to === to;
            return (
              <Pressable
                key={pair.label}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.pairRow,
                  index === 0 && styles.pairRowFirst,
                  active && styles.pairRowActive,
                  pressed && styles.pairRowPressed,
                ]}
                onPress={() => applyPair(pair.from, pair.to)}
              >
                <Text style={[styles.pairTag, active && styles.pairTagActive]}>{pair.tag}</Text>
                <Text style={[styles.pairLabel, active && styles.pairLabelActive]}>{pair.label}</Text>
                <ChevronRightIcon size={14} color={active ? colors.primary : colors.textTertiary} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footer}>
          1 尺 = 1/3 米，1 斤 = 500 克，1 克拉 = 0.2 克 · 结果仅供参考
        </Text>
      </ScrollView>

      <UnitPickerModal
        visible={picker === 'from'}
        title="选择从单位"
        units={units}
        selected={from}
        onClose={() => setPicker(null)}
        onSelect={setFrom}
      />
      <UnitPickerModal
        visible={picker === 'to'}
        title="选择到单位"
        units={units}
        selected={to}
        onClose={() => setPicker(null)}
        onSelect={setTo}
      />
      <InfoModal visible={infoVisible} title="换算说明" content={CALC_INFO} onClose={() => setInfoVisible(false)} />
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
  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },

  /* 分类切换 */
  tabBar: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    backgroundColor: '#E9EDF3',
    borderRadius: radius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.card,
    ...shadow.card,
  },
  tabText: {
    fontSize: fontSize.normal,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
  fieldRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: 64,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: '#2C3A36',
  },
  inputWrap: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F5F5',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: fontSize.normal,
    color: colors.textStrong,
  },
  amountUnit: {
    marginLeft: spacing.sm,
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  unitCol: {
    flex: 1,
  },
  unitLabel: {
    marginBottom: 6,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  select: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F5F5',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
  },
  selectText: {
    flex: 1,
  },
  selectSymbol: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  selectName: {
    marginTop: 1,
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  swapBtn: {
    width: 40,
    height: 46,
    marginBottom: 5,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#BFDCD1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBtnPressed: {
    backgroundColor: '#EAF4F0',
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
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
  valueRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultNumber: {
    flexShrink: 1,
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  resultUnit: {
    marginLeft: spacing.sm,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: '#4F8C7A',
  },
  rateBox: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratePrefix: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rateValue: {
    flexShrink: 1,
    marginHorizontal: 6,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  rateSuffix: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inverseRate: {
    marginTop: 4,
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },

  /* 常用换算 */
  quickCard: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  quickTitle: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: '#2C3A36',
  },
  quickSub: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  pairRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  pairRowFirst: {
    borderTopWidth: 0,
  },
  pairRowActive: {
    backgroundColor: '#EAF4F0',
  },
  pairRowPressed: {
    backgroundColor: '#F3F6F5',
  },
  pairTag: {
    width: 56,
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pairTagActive: {
    color: colors.primary,
  },
  pairLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  pairLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  footer: {
    marginTop: spacing.lg,
    fontSize: fontSize.mini,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
