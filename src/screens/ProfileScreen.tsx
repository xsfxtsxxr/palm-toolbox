/**
 * 我的：账号卡片 + 计算次数统计 + 夜间模式 + 设置
 */
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, shadow, spacing } from '../theme/theme';
import { useCalculations } from '../context/CalculationContext';
import { useCalcStats } from '../context/CalcStatsContext';
import { useToast } from '../components/Toast';
import { PickerModal } from '../components/PickerModal';
import { AvatarPersonIcon, ChevronRightIcon } from '../components/icons/UIIcons';
import { useTheme, useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import type { Palette } from '../theme/theme';
import type { ThemeMode } from '../theme/ThemeContext';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** 缓存类 key（不含用户数据：记账、待办、计算记录） */
const CACHE_KEYS = ['fx_rates', 'gold_quote'];

const APPEARANCE_OPTIONS: { key: ThemeMode; label: string; desc: string }[] = [
  { key: 'system', label: '跟随系统', desc: '随手机的深色模式自动切换' },
  { key: 'light', label: '浅色', desc: '始终使用浅色界面' },
  { key: 'dark', label: '深色', desc: '始终使用深色界面，夜间更护眼' },
];

const appearanceLabel = (mode: ThemeMode) =>
  APPEARANCE_OPTIONS.find((item) => item.key === mode)?.label ?? '跟随系统';

const topToolName = (tools: { name: string; count: number }[]) => {
  const top = [...tools].sort((a, b) => b.count - a.count)[0];
  return top && top.count > 0 ? top.name : '暂无';
};

export const ProfileScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { totalCount } = useCalculations();
  const { summary } = useCalcStats();
  const { mode, scheme, setMode, setDark } = useTheme();

  const [appearanceVisible, setAppearanceVisible] = useState(false);

  const handleClearCache = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(CACHE_KEYS);
      showToast('汇率与金价缓存已清除');
    } catch {
      showToast('清除失败，请稍后重试');
    }
  }, [showToast]);

  const darkOn = scheme === 'dark';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>我的</Text>

        {/* 账号卡片 */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.accountCard, shadow.card, pressed && styles.pressed]}
          onPress={() => showToast('账号体系将在后续版本接入')}
        >
          <View style={styles.avatar}>
            <AvatarPersonIcon size={30} color={colors.accent} />
          </View>
          <View style={styles.accountText}>
            <Text style={styles.accountName}>小明</Text>
            <Text style={styles.accountSub}>普通会员 · ID 20261016</Text>
          </View>
          <ChevronRightIcon size={18} color={colors.textTertiary} />
        </Pressable>

        {/* 计算次数速览 */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.statCard, shadow.card, pressed && styles.pressed]}
          onPress={() => navigation.navigate('CalcRecords')}
        >
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>计算次数</Text>
            <View style={styles.statMore}>
              <Text style={styles.statMoreText}>查看记录</Text>
              <ChevronRightIcon size={14} color={colors.textTertiary} />
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{summary.total}</Text>
                <Text style={styles.statUnit}>次</Text>
              </View>
              <Text style={styles.statLabel}>累计</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{summary.today}</Text>
                <Text style={styles.statUnit}>次</Text>
              </View>
              <Text style={styles.statLabel}>今天</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{summary.last7}</Text>
                <Text style={styles.statUnit}>次</Text>
              </View>
              <Text style={styles.statLabel}>近 7 天</Text>
            </View>
          </View>

          <Text style={styles.statHint}>
            {summary.total === 0
              ? '还没有计算记录，去首页挑个工具试试'
              : summary.streak > 1
                ? `已连续使用 ${summary.streak} 天，最常用「${topToolName(summary.tools)}」`
                : `最常用「${topToolName(summary.tools)}」`}
          </Text>
        </Pressable>

        {/* 功能列表 */}
        <View style={[styles.group, shadow.card]}>
          <MenuRow
            label="我的计算"
            value={summary.total > 0 ? `${summary.total} 次` : '暂无'}
            onPress={() => navigation.navigate('CalcRecords')}
          />
          <MenuRow
            label="房贷测算记录"
            value={totalCount > 0 ? `${totalCount} 条` : '暂无'}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Statistics' })}
          />
          <MenuRow label="清除缓存" onPress={() => void handleClearCache()} last />
        </View>

        {/* 外观 */}
        <View style={[styles.group, shadow.card]}>
          <View style={[styles.row, styles.rowNoBorder]}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>夜间模式</Text>
              <Text style={styles.rowDesc}>{darkOn ? '深色界面已开启' : '深色界面已关闭'}</Text>
            </View>
            <Switch
              value={darkOn}
              onValueChange={(value) => {
                setDark(value);
                showToast(value ? '已切换到深色模式' : '已切换到浅色模式');
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
          <MenuRow
            label="外观"
            value={appearanceLabel(mode)}
            onPress={() => setAppearanceVisible(true)}
            last
          />
        </View>

        <View style={[styles.group, shadow.card]}>
          <MenuRow
            label="关于掌中工具箱"
            value="v1.0.0"
            onPress={() => showToast('掌中工具箱 v1.0.0 · Expo SDK 58')}
          />
          <MenuRow label="给我们评分" onPress={() => showToast('感谢支持！评分功能开发中')} last />
        </View>

        <Text style={styles.footer}>掌中工具箱 v1.0.0{'\n'}跨平台 · React Native + Expo</Text>
      </ScrollView>

      <PickerModal
        visible={appearanceVisible}
        title="外观"
        onClose={() => setAppearanceVisible(false)}
      >
        {APPEARANCE_OPTIONS.map((option) => {
          const active = option.key === mode;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              style={[styles.option, active && styles.optionActive]}
              onPress={() => {
                setMode(option.key);
                setAppearanceVisible(false);
              }}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDesc}>{option.desc}</Text>
              </View>
              {active ? <Text style={styles.optionCheck}>✓</Text> : null}
            </Pressable>
          );
        })}
      </PickerModal>
    </View>
  );
};

const MenuRow: React.FC<{
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}> = ({ label, value, onPress, last }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, last && styles.rowNoBorder, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <ChevronRightIcon size={16} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: spacing.lg,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.textStrong,
  },
  accountSub: {
    marginTop: 3,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  /* 计算次数卡 */
  statCard: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  statMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statMoreText: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.divider,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    marginLeft: 2,
    marginBottom: 3,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  statHint: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },

  /* 设置分组 */
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: fontSize.normal,
    color: colors.text,
  },
  rowDesc: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowValue: {
    fontSize: fontSize.body,
    color: colors.textTertiary,
  },

  /* 外观选项 */
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.inputBg,
  },
  optionActive: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.text,
  },
  optionLabelActive: {
    color: colors.primary,
  },
  optionDesc: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  optionCheck: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
  },

  footer: {
    marginTop: spacing.xxl,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
