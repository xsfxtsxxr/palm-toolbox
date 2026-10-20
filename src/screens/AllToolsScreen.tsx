/**
 * 全部工具页：9 个工具列表 + 上线状态
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing, tileThemes } from '../theme/theme';
import { TOOLS } from '../data/tools';
import type { Tool } from '../types';
import { useToast } from '../components/Toast';
import { ToolIcon } from '../components/icons/ToolIcons';
import { BackIcon, ChevronRightIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const AllToolsScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const handlePress = (tool: Tool) => {
    if (tool.id === 'mortgage') {
      navigation.navigate('MortgageCalculator');
    } else if (tool.id === 'deposit') {
      navigation.navigate('DepositCalculator');
    } else if (tool.id === 'financial') {
      navigation.navigate('FinancialCalculator');
    } else if (tool.id === 'tax') {
      navigation.navigate('TaxCalculator');
    } else if (tool.id === 'currency') {
      navigation.navigate('CurrencyConverter');
    } else {
      showToast(`「${tool.name}」即将上线，敬请期待`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={12} style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.title}>全部工具</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {TOOLS.map((tool) => {
          const tile = tileThemes[tool.tile];
          return (
            <Pressable
              key={tool.id}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, shadow.card, pressed && styles.pressed]}
              onPress={() => handlePress(tool)}
            >
              <View style={[styles.tile, { backgroundColor: tile.bg }]}>
                <ToolIcon name={tool.icon} size={24} color={tile.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name}>{tool.name}</Text>
                <Text style={styles.subtitle}>{tool.subtitle}</Text>
              </View>
              <View style={[styles.statusPill, tool.implemented ? styles.statusOnline : styles.statusDev]}>
                <Text style={[styles.statusText, tool.implemented ? styles.statusTextOnline : null]}>
                  {tool.implemented ? '已上线' : '开发中'}
                </Text>
              </View>
              <ChevronRightIcon size={16} color={colors.textTertiary} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  subtitle: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusOnline: {
    backgroundColor: colors.greenLight,
  },
  statusDev: {
    backgroundColor: '#F2F4F8',
  },
  statusText: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  statusTextOnline: {
    color: colors.green,
    fontWeight: '600',
  },
});
