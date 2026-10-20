/**
 * 金价查询：上海金 Au99.99 + 品牌金店挂牌价 + 银行投资金条
 *
 * 数据源：公开行情接口（tmini 聚合），缓存 5 分钟；
 * 请求失败回退上次缓存并提示「金价可能过期」
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  averageBrandPrice,
  averagePremium,
  fmtGoldChange,
  fmtGoldPct,
  fmtGoldPrice,
  type GoldBrand,
  type GoldQuote,
} from '../utils/gold';
import { loadGoldQuote } from '../utils/goldStorage';
import { InfoModal } from '../components/InfoModal';
import {
  AlertIcon,
  BackIcon,
  ChevronRightIcon,
  InfoIcon,
  RefreshIcon,
} from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const HELP_TEXT =
  '金价数据来自公开行情接口，一次请求同时取回上金所现货品种与各品牌金店挂牌价。\n\n' +
  '· 上海金 Au99.99：上海黄金交易所黄金现货基准价，是国内金价的定价锚；\n' +
  '· 品牌金店挂牌价：周大福、老凤祥、周生生等门店当日足金零售牌价，右侧标注的是相对 Au99.99 的溢价；\n' +
  '· 银行投资金条：工行、建行等投资金条报价，通常最贴近基础金价。\n\n' +
  '涨跌以上海金当日今开价为基准计算（不是相对昨收）。品牌牌价不含工费，实际成交以门店为准。\n\n' +
  '数据缓存 5 分钟，可下拉刷新或点右上角按钮强制更新；请求失败时会展示上次缓存并提示可能过期。';

/** 显示前 N 家银行，其余折叠 */
const BANK_LIMIT = 5;

const pad = (value: number) => String(value).padStart(2, '0');

/** "2026-10-20 16:03:11" → "10-20 16:03" */
function formatUpdated(raw: string, fallback: string): string {
  const matched = raw.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (matched) return `${matched[2]}-${matched[3]} ${matched[4]}:${matched[5]}`;
  return fallback;
}

/** 抓取时间戳 → "10-20 16:03" */
function formatFetchedAt(timestamp: number): string {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

/** 溢价标签：整数展示，避免过长 */
function premiumLabel(premium: number): string {
  const value = Math.round(premium);
  if (value > 0) return `+${value}`;
  return String(value);
}

export const GoldPriceScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [quote, setQuote] = useState<GoldQuote | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'stale' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [sortByPrice, setSortByPrice] = useState(false);
  const [showAllBanks, setShowAllBanks] = useState(false);

  const alive = useRef(true);

  const load = useCallback(async (force = false) => {
    const result = await loadGoldQuote({ force });
    if (!alive.current) return;
    if (!result) {
      setStatus('error');
      return;
    }
    setQuote(result.quote);
    setFetchedAt(result.fetchedAt);
    setStatus(result.source === 'stale' ? 'stale' : 'ready');
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (!quote) setStatus('loading');
    await load(true);
    if (alive.current) setRefreshing(false);
  }, [load, quote]);

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

  const spot = quote?.spot;
  const up = (spot?.change ?? 0) > 0;
  const down = (spot?.change ?? 0) < 0;
  const trendColor = up ? colors.red : down ? colors.green : colors.textSecondary;

  const brands = useMemo<GoldBrand[]>(() => {
    if (!quote) return [];
    return sortByPrice
      ? [...quote.brands].sort((a, b) => b.price - a.price)
      : quote.brands;
  }, [quote, sortByPrice]);

  const banks = quote?.banks ?? [];
  const visibleBanks = showAllBanks ? banks : banks.slice(0, BANK_LIMIT);

  const avgPrice = quote ? averageBrandPrice(quote.brands) : 0;
  const avgPremium = quote ? averagePremium(quote.brands) : 0;

  const updatedLabel = quote ? formatUpdated(quote.spot.updatedAt, quote.date) : '--';

  return (
    <LinearGradient colors={[colors.screenFrom, colors.screenTo]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="刷新金价"
            hitSlop={12}
            disabled={refreshing}
            onPress={() => void refresh()}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.heroTitle}>今日金价</Text>
        <Text style={styles.heroSubtitle}>上海金基准价 · 各大品牌挂牌价</Text>

        {/* 数据状态 */}
        {status === 'loading' && !quote ? (
          <View style={[styles.banner, styles.bannerInfo]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.bannerText, styles.bannerTextInfo]}>正在获取最新金价…</Text>
          </View>
        ) : null}
        {status === 'stale' ? (
          <View style={[styles.banner, styles.bannerWarn]}>
            <AlertIcon size={14} color="#B7791F" />
            <Text style={[styles.bannerText, styles.bannerTextWarn]}>
              金价可能过期，当前为 {formatFetchedAt(fetchedAt)} 的缓存数据
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void refresh()}>
              <Text style={styles.bannerAction}>重试</Text>
            </Pressable>
          </View>
        ) : null}
        {status === 'error' ? (
          <View style={[styles.banner, styles.bannerError]}>
            <AlertIcon size={14} color={colors.red} />
            <Text style={[styles.bannerText, styles.bannerTextError]}>
              金价获取失败，请检查网络后重试
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void refresh()}>
              <Text style={styles.bannerAction}>重试</Text>
            </Pressable>
          </View>
        ) : null}

        {/* 主力合约卡 */}
        <LinearGradient
          colors={[colors.mintFrom, colors.mintTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.spotCard}
        >
          <View style={styles.spotHeader}>
            <View style={styles.spotTitleWrap}>
              <Text style={styles.spotLabel}>上海金</Text>
              <Text style={styles.spotName}>Au99.99</Text>
            </View>
            <Text style={styles.spotUnit}>元 / 克</Text>
          </View>

          <Text
            style={styles.spotPrice}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {spot ? `¥ ${fmtGoldPrice(spot.price)}` : '¥ --'}
          </Text>

          <View style={styles.trendRow}>
            <View style={[styles.trendChip, { backgroundColor: `${trendColor}14` }]}>
              <Text style={[styles.trendText, { color: trendColor }]}>
                {spot ? `${up ? '▲' : down ? '▼' : '—'} ${fmtGoldChange(spot.change)}` : '--'}
              </Text>
              <Text style={[styles.trendText, { color: trendColor }]}>
                {spot ? fmtGoldPct(spot.changePct) : '--'}
              </Text>
            </View>
            <Text style={styles.trendHint}>较今开</Text>
          </View>

          <View style={styles.spotStats}>
            <View style={styles.spotStatCell}>
              <Text style={styles.spotStatLabel}>今开</Text>
              <Text style={styles.spotStatValue}>{spot ? fmtGoldPrice(spot.open) : '--'}</Text>
            </View>
            <View style={styles.spotStatDivider} />
            <View style={styles.spotStatCell}>
              <Text style={styles.spotStatLabel}>最高</Text>
              <Text style={styles.spotStatValue}>{spot ? fmtGoldPrice(spot.high) : '--'}</Text>
            </View>
            <View style={styles.spotStatDivider} />
            <View style={styles.spotStatCell}>
              <Text style={styles.spotStatLabel}>最低</Text>
              <Text style={styles.spotStatValue}>{spot ? fmtGoldPrice(spot.low) : '--'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 品牌挂牌价 */}
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>品牌金店挂牌价</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              style={styles.sortBtn}
              onPress={() => setSortByPrice((prev) => !prev)}
            >
              <Text style={styles.sortText}>{sortByPrice ? '价格优先' : '品牌优先'}</Text>
              <ChevronRightIcon size={13} color={colors.textTertiary} />
            </Pressable>
          </View>

          {quote && quote.brands.length > 0 ? (
            <Text style={styles.cardSummary}>
              均价 {fmtGoldPrice(avgPrice)} 元/克 · 较基准金价 {premiumLabel(avgPremium)} 元/克
            </Text>
          ) : null}

          {brands.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {status === 'loading' ? '正在加载品牌报价…' : '暂未获取到品牌报价'}
              </Text>
            </View>
          ) : (
            <View style={styles.brandList}>
              {brands.map((brand, index) => (
                <View
                  key={brand.brand}
                  style={[styles.brandRow, index > 0 && styles.brandRowDivider]}
                >
                  <Text style={styles.brandName}>{brand.brand}</Text>
                  <View style={styles.premiumTag}>
                    <Text style={styles.premiumText}>{premiumLabel(brand.premium)}</Text>
                  </View>
                  <Text style={styles.brandPrice}>{fmtGoldPrice(brand.price)}</Text>
                  <Text style={styles.brandUnit}>元/克</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <AlertIcon size={12} color="#B7791F" />
            <Text style={styles.cardFooterText}>牌价不含工费，实际成交以门店为准</Text>
          </View>
        </View>

        {/* 银行投资金条 */}
        {banks.length > 0 ? (
          <View style={[styles.card, shadow.card]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>银行投资金条</Text>
              <Text style={styles.cardTag}>共 {banks.length} 家</Text>
            </View>

            <View style={styles.brandList}>
              {visibleBanks.map((bank, index) => (
                <View
                  key={`${bank.bank}-${bank.product}`}
                  style={[styles.brandRow, index > 0 && styles.brandRowDivider]}
                >
                  <Text style={styles.brandName}>{bank.bank}</Text>
                  <Text style={styles.bankProduct} numberOfLines={1}>
                    {bank.product}
                  </Text>
                  <Text style={styles.brandPrice}>{fmtGoldPrice(bank.price)}</Text>
                  <Text style={styles.brandUnit}>元/克</Text>
                </View>
              ))}
            </View>

            {banks.length > BANK_LIMIT ? (
              <Pressable
                accessibilityRole="button"
                style={styles.moreBtn}
                onPress={() => setShowAllBanks((prev) => !prev)}
              >
                <Text style={styles.moreText}>
                  {showAllBanks ? '收起' : `展开全部 ${banks.length} 家`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* 其他行情 */}
        {quote && quote.others.length > 0 ? (
          <View style={[styles.card, shadow.card]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>其他行情</Text>
            </View>

            <View style={styles.brandList}>
              {quote.others.map((item, index) => {
                const itemUp = item.change > 0;
                const itemDown = item.change < 0;
                const itemColor = itemUp ? colors.red : itemDown ? colors.green : colors.textSecondary;
                return (
                  <View
                    key={item.name}
                    style={[styles.otherRow, index > 0 && styles.brandRowDivider]}
                  >
                    <View style={styles.otherNameCell}>
                      <Text style={styles.otherName} numberOfLines={1}>
                        {item.name.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.otherUnit}>{item.unit}</Text>
                    </View>
                    <Text style={[styles.otherChange, { color: itemColor }]}>
                      {fmtGoldChange(item.change)}
                    </Text>
                    <Text style={styles.brandPrice}>{fmtGoldPrice(item.price)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {quote ? `更新于 ${updatedLabel} · 报价日 ${quote.date}` : '等待金价数据'}
          </Text>
          <Text style={styles.footerText}>数据来源：上海黄金交易所 / 各品牌金店公开报价</Text>
        </View>
      </ScrollView>

      <InfoModal
        visible={infoVisible}
        title="金价说明"
        content={HELP_TEXT}
        onClose={() => setInfoVisible(false)}
      />
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

  /* 主力合约卡 */
  spotCard: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CDE9DE',
    padding: spacing.lg,
  },
  spotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  spotLabel: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
  },
  spotName: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: '#4F8C7A',
  },
  spotUnit: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },
  spotPrice: {
    marginTop: spacing.sm,
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  trendText: {
    fontSize: fontSize.small,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trendHint: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  spotStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  spotStatCell: {
    flex: 1,
    alignItems: 'center',
  },
  spotStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#DCEAE4',
  },
  spotStatLabel: {
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  spotStatValue: {
    marginTop: 4,
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: '#2C3A36',
    fontVariant: ['tabular-nums'],
  },

  /* 通用卡片 */
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
  },
  cardTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
  },
  cardSummary: {
    marginTop: 4,
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  cardTag: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 26,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#EAF4F0',
  },
  sortText: {
    fontSize: fontSize.mini,
    fontWeight: '700',
    color: colors.primary,
  },

  /* 品牌 / 银行行 */
  brandList: {
    marginTop: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
  },
  brandRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  brandName: {
    flex: 1,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: '#2C3A36',
  },
  premiumTag: {
    marginRight: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: '#FFF4DC',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  premiumText: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: '#B47C09',
    fontVariant: ['tabular-nums'],
  },
  brandPrice: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  brandUnit: {
    marginLeft: 4,
    width: 34,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  bankProduct: {
    flexShrink: 1,
    marginRight: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  otherChange: {
    marginRight: spacing.sm,
    fontSize: fontSize.small,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 6,
  },
  otherNameCell: {
    flex: 1,
  },
  otherName: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: '#2C3A36',
  },
  otherUnit: {
    marginTop: 1,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  moreBtn: {
    marginTop: spacing.sm,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: '#F2F6F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cardFooterText: {
    flex: 1,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  emptyBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },

  footer: {
    marginTop: spacing.lg,
    gap: 4,
  },
  footerText: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
});
