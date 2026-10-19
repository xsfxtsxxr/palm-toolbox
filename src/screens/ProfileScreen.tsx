/**
 * 我的：账号卡片 + 设置列表
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import { useCalculations } from '../context/CalculationContext';
import { useToast } from '../components/Toast';
import { AvatarPersonIcon, ChevronRightIcon } from '../components/icons/UIIcons';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { totalCount } = useCalculations();
  const [notifyOn, setNotifyOn] = useState(true);
  const [darkOn, setDarkOn] = useState(false);

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
            <AvatarPersonIcon size={30} color="#3E7BFA" />
          </View>
          <View style={styles.accountText}>
            <Text style={styles.accountName}>小明</Text>
            <Text style={styles.accountSub}>普通会员 · ID 20261016</Text>
          </View>
          <ChevronRightIcon size={18} color={colors.textTertiary} />
        </Pressable>

        {/* 功能列表 */}
        <View style={[styles.group, shadow.card]}>
          <MenuRow
            label="我的计算"
            value={totalCount > 0 ? `${totalCount} 次` : '暂无'}
            onPress={() => showToast('计算记录开发中')}
          />
          <MenuRow label="还款计划导出" onPress={() => showToast('请在还款计划页点击导出')} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>消息提醒</Text>
            <Switch
              value={notifyOn}
              onValueChange={(value) => {
                setNotifyOn(value);
                showToast(value ? '已开启还款提醒' : '已关闭还款提醒');
              }}
              trackColor={{ true: colors.primary, false: '#D8DEE7' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>夜间模式</Text>
            <Switch
              value={darkOn}
              onValueChange={() => {
                setDarkOn(false);
                showToast('夜间模式开发中');
              }}
              trackColor={{ true: colors.primary, false: '#D8DEE7' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <MenuRow label="清除缓存" onPress={() => showToast('缓存已清除')} />
        </View>

        <View style={[styles.group, shadow.card]}>
          <MenuRow label="关于掌中工具箱" value="v1.0.0" onPress={() => showToast('掌中工具箱 v1.0.0 · Expo SDK 58')} />
          <MenuRow label="给我们评分" onPress={() => showToast('感谢支持！评分功能开发中')} />
        </View>

        <Text style={styles.footer}>掌中工具箱 v1.0.0{'\n'}跨平台 · React Native + Expo</Text>
      </ScrollView>
    </View>
  );
};

const MenuRow: React.FC<{
  label: string;
  value?: string;
  onPress: () => void;
}> = ({ label, value, onPress }) => (
  <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <ChevronRightIcon size={16} color={colors.textTertiary} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
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
    backgroundColor: '#E3EEFF',
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
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: {
    fontSize: fontSize.normal,
    color: colors.text,
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
  footer: {
    marginTop: spacing.xxl,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
