/** 月份切换器（流水 / 统计共用） */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { currentMonthKey, formatMonthCN, shiftMonth } from '../utils/ledger';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/UIIcons';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  month: string;
  onChange: (month: string) => void;
  /** 允许切换到的最晚月份，默认当前月 */
  maxMonth?: string;
}

export const MonthSwitcher: React.FC<Props> = ({ month, onChange, maxMonth = currentMonthKey() }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const canGoNext = month < maxMonth;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="上一个月"
        hitSlop={8}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        onPress={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeftIcon size={18} color={colors.primary} />
      </Pressable>

      <Text style={styles.label}>{formatMonthCN(month)}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="下一个月"
        hitSlop={8}
        disabled={!canGoNext}
        style={({ pressed }) => [
          styles.arrow,
          !canGoNext && styles.arrowDisabled,
          pressed && canGoNext && styles.arrowPressed,
        ]}
        onPress={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRightIcon size={18} color={canGoNext ? colors.primary : colors.textPlaceholder} />
      </Pressable>
    </View>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPressed: {
    backgroundColor: '#E7F2EF',
  },
  arrowDisabled: {
    backgroundColor: 'transparent',
  },
  label: {
    minWidth: 108,
    textAlign: 'center',
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.textStrong,
  },
});
