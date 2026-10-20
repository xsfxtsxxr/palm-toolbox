/**
 * 汇率换算：Frankfurter（欧洲央行 ECB 参考汇率）+ 本地缓存
 * 缓存策略：1 小时内直接用本地缓存，过期才请求；请求失败回退上次缓存并提示可能过期
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  COMMON_CURRENCY_CODES,
  CURRENCIES,
  QUICK_CURRENCY_CODES,
  convertAmount,
  crossRate,
  currencyName,
  fmtRate,
  type FxRates,
} from '../utils/currency';
import { loadFxRates } from '../utils/fxCache';
import { fmtDecimal, fmtMoneyInput, parseMoney } from '../utils/format';
import { CurrencyPickerModal } from '../components/CurrencyPickerModal';
import { InfoModal } from '../components/InfoModal';
import { useCalcCommitOnLeave, useCalcDirty } from '../hooks/useCalcRecord';
import {
  AlertIcon,
  BackIcon,
  ChevronRightIcon,
  InfoIcon,
  RefreshIcon,
  SwapIcon,
} from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type PickerTarget = 'from' | 'to' | 'fromCommon' | 'toCommon' | null;

const ALL_CODES = CURRENCIES.map((currency) => currency.code);

const CALC_INFO =
  '汇率数据来自 Frankfurter（欧洲央行 ECB 参考汇率），非银行柜台成交价。\n\n' +
  '· 以 1 CNY 为基准一次获取全部币种汇率，任意两种货币按交叉汇率换算；\n' +
  '· 打开页面先读本地缓存 fx_rates，1 小时内直接使用，不重复请求；\n' +
  '· 缓存过期后请求接口，成功后写入缓存；请求失败则使用上次缓存，并提示「汇率可能过期」。\n\n' +
  'ECB 参考汇率每个工作日约 16:00（中欧时间）更新一次，周末与节假日沿用上一交易日数据，因此短时间内换算结果可能不变。\n\n' +
  '换算结果仅供参考，实际结汇 / 购汇价格以银行或支付机构实时报价为准。';

export const CurrencyConverterScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [amountText, setAmountText] = useState('10000');
  const [from, setFrom] = useState('CNY');
  const [to, setTo] = useState('USD');

  const [rates, setRates] = useState<FxRates | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'stale' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const [picker, setPicker] = useState<PickerTarget>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const alive = useRef(true);

  const load = useCallback(async (force = false) => {
    const result = await loadFxRates({ force });
    if (!alive.current) return;
    if (!result) {
      setStatus('error');
      return;
    }
    setRates(result.rates);
    setStatus(result.source === 'stale' ? 'stale' : 'ready');
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (!rates) setStatus('loading');
    await load(true);
    if (alive.current) setRefreshing(false);
  }, [load, rates]);

  useEffect(() => {
    alive.current = true;
    // 首屏异步加载，避免在 effect 内同步更新状态
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => {
      alive.current = false;
      clearTimeout(timer);
    };
  }, [load]);

  const amount = parseMoney(amountText);
  const rate = rates ? crossRate(rates.rates, from, to) : 0;
  const converted = rates ? convertAmount(amount, rates.rates, from, to) : 0;
  const inverseRate = rate > 0 ? 1 / rate : 0;
  const ready = !!rates && rate > 0;

  // 实时换算：改过金额或币种后离开页面才算用了一次
  const fxDirty = useCalcDirty(`${amountText}|${from}|${to}`);
  useCalcCommitOnLeave('currency', ready ? `${amountText} ${from} → ${to}` : null, fxDirty);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const selectFrom = (code: string) => {
    if (code === to) setTo(from);
    setFrom(code);
  };

  const selectTo = (code: string) => {
    if (code === from) setFrom(to);
    setTo(code);
  };

  const pickerVisible = picker !== null;

  return (
    <LinearGradient colors={[colors.screenFrom, colors.screenTo]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="刷新汇率"
            hitSlop={12}
            disabled={refreshing}
            onPress={() => refresh()}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshIcon size={20} color={colors.textSecondary} />
            )}
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setInfoVisible(true)}>
            <InfoIcon size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 标题区 */}
        <Text style={styles.heroTitle}>汇率换算</Text>
        <Text style={styles.heroSubtitle}>实时汇率换算，支持多币种互转</Text>

        {/* 数据状态提示 */}
        {status === 'loading' && !rates ? (
          <View style={[styles.banner, styles.bannerInfo]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.bannerText, styles.bannerTextInfo]}>正在获取最新汇率…</Text>
          </View>
        ) : null}
        {status === 'stale' ? (
          <View style={[styles.banner, styles.bannerWarn]}>
            <AlertIcon size={14} color="#B7791F" />
            <Text style={[styles.bannerText, styles.bannerTextWarn]}>
              汇率可能过期，当前为 {rates?.date ?? '上次'} 的缓存数据
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => refresh()}>
              <Text style={styles.bannerAction}>重试</Text>
            </Pressable>
          </View>
        ) : null}
        {status === 'error' ? (
          <View style={[styles.banner, styles.bannerError]}>
            <AlertIcon size={14} color={colors.red} />
            <Text style={[styles.bannerText, styles.bannerTextError]}>
              汇率获取失败，请检查网络后重试
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => refresh()}>
              <Text style={styles.bannerAction}>重试</Text>
            </Pressable>
          </View>
        ) : null}

        {/* 输入卡 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>换算</Text>
            <Text style={styles.required}>* 必填</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>金额</Text>
            <View style={[styles.input, styles.amountWrap]}>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(text) => setAmountText(fmtMoneyInput(text))}
                placeholder="请输入金额"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="decimal-pad"
                maxLength={18}
              />
              <Text style={styles.amountUnit}>{from}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>源币种</Text>
            <Pressable accessibilityRole="button" style={[styles.input, styles.select]} onPress={() => setPicker('from')}>
              <Text style={styles.selectCode}>{from}</Text>
              <Text style={styles.selectName}>{currencyName(from)}</Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.presetBtn} onPress={() => setPicker('fromCommon')}>
              <Text style={styles.presetText}>常用币种</Text>
            </Pressable>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>目标币种</Text>
            <Pressable accessibilityRole="button" style={[styles.input, styles.select]} onPress={() => setPicker('to')}>
              <Text style={styles.selectCode}>{to}</Text>
              <Text style={styles.selectName}>{currencyName(to)}</Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.presetBtn} onPress={() => setPicker('toCommon')}>
              <Text style={styles.presetText}>常用币种</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="互换源币种和目标币种"
            style={({ pressed }) => [styles.swapBtn, pressed && styles.swapBtnPressed]}
            onPress={swap}
          >
            <SwapIcon size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.swapHint}>点击互换币种</Text>
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
            {rates ? <Text style={styles.resultTag}>ECB · {rates.date}</Text> : null}
          </View>

          <View style={styles.resultRow}>
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>换算结果</Text>
              <Text
                style={[styles.resultValue, !ready && styles.resultValueMuted]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
              >
                {ready ? fmtDecimal(converted, 2) : '--'}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultCell}>
              <Text style={styles.resultLabel}>目标币种</Text>
              <Text style={styles.resultCode}>{to}</Text>
            </View>
          </View>

          <View style={styles.rateBox}>
            <View style={styles.rateRow}>
              <Text style={styles.ratePrefix}>
                1 {from} =
              </Text>
              <Text
                style={styles.rateValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {ready ? fmtRate(rate) : '--'}
              </Text>
              <Text style={styles.rateSuffix}>{to}</Text>
            </View>
            <Text style={styles.inverseRate}>
              {ready ? `1 ${to} = ${fmtRate(inverseRate)} ${from}` : '汇率加载后可查看反向汇率'}
            </Text>
          </View>
        </LinearGradient>

        {/* 常用货币 */}
        <View style={[styles.card, styles.quickCard, shadow.card]}>
          <Text style={styles.quickTitle}>常用货币</Text>
          <View style={styles.chipRow}>
            {QUICK_CURRENCY_CODES.map((code) => {
              const active = code === to;
              return (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => selectTo(code)}
                >
                  <Text style={[styles.chipCode, active && styles.chipCodeActive]}>{code}</Text>
                  <Text style={[styles.chipName, active && styles.chipNameActive]}>{currencyName(code)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>汇率参考央行中间价，非银行柜台成交价</Text>
          <Text style={styles.footerText}>
            {rates ? `更新于 ${rates.date} · ECB` : '等待汇率数据'}
          </Text>
        </View>
      </ScrollView>

      <CurrencyPickerModal
        visible={pickerVisible && (picker === 'from' || picker === 'fromCommon')}
        title={picker === 'fromCommon' ? '常用币种' : '选择源币种'}
        selected={from}
        codes={picker === 'fromCommon' ? COMMON_CURRENCY_CODES : ALL_CODES}
        onClose={() => setPicker(null)}
        onSelect={selectFrom}
      />
      <CurrencyPickerModal
        visible={pickerVisible && (picker === 'to' || picker === 'toCommon')}
        title={picker === 'toCommon' ? '常用币种' : '选择目标币种'}
        selected={to}
        codes={picker === 'toCommon' ? COMMON_CURRENCY_CODES : ALL_CODES}
        onClose={() => setPicker(null)}
        onSelect={selectTo}
      />
      <InfoModal visible={infoVisible} title="数据说明" content={CALC_INFO} onClose={() => setInfoVisible(false)} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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

  /* 状态提示 */
  banner: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  bannerInfo: {
    backgroundColor: '#EAF4F0',
  },
  bannerWarn: {
    backgroundColor: '#FFF5E6',
  },
  bannerError: {
    backgroundColor: colors.redLight,
  },
  bannerText: {
    flex: 1,
    fontSize: fontSize.mini,
    lineHeight: 16,
  },
  bannerTextInfo: {
    color: '#3F6B5E',
  },
  bannerTextWarn: {
    color: '#8A5A16',
  },
  bannerTextError: {
    color: colors.red,
  },
  bannerAction: {
    fontSize: fontSize.mini,
    fontWeight: '700',
    color: colors.primary,
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
    marginBottom: spacing.xs,
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
  label: {
    width: 64,
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
  amountWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: fontSize.normal,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  amountUnit: {
    marginLeft: spacing.sm,
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  select: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectCode: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.textStrong,
  },
  selectName: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  presetBtn: {
    height: 38,
    marginLeft: spacing.sm,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: '#DCEFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: fontSize.mini,
    fontWeight: '700',
    color: colors.primary,
  },
  swapBtn: {
    alignSelf: 'center',
    width: 46,
    height: 46,
    marginTop: spacing.lg,
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
  swapHint: {
    marginTop: 6,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'center',
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
    backgroundColor: colors.white,
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
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  resultValueMuted: {
    color: '#9FB8AF',
  },
  resultCode: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
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
    fontSize: 21,
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

  /* 常用货币 */
  quickCard: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  quickTitle: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: '#2C3A36',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: '#EAF4F0',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipCode: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.primary,
  },
  chipCodeActive: {
    color: colors.white,
  },
  chipName: {
    fontSize: fontSize.small,
    color: '#4F7C6D',
  },
  chipNameActive: {
    color: 'rgba(255,255,255,0.86)',
  },

  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerText: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
});
