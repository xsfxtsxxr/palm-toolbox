/**
 * 首次还款日期选择器（年 + 月）
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/UIIcons';
import { PickerModal } from './PickerModal';

interface Props {
  visible: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onConfirm: (year: number, month: number) => void;
}

const MIN_YEAR = 2015;
const MAX_YEAR = 2045;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const MonthPickerModal: React.FC<Props> = ({ visible, year, month, onClose, onConfirm }) => {
  const [pickedYear, setPickedYear] = useState(year);
  const [pickedMonth, setPickedMonth] = useState(month);

  const handleConfirm = () => {
    onConfirm(pickedYear, pickedMonth);
    onClose();
  };

  return (
    <PickerModal
      visible={visible}
      title="选择首次还款日期"
      onClose={onClose}
      footer={
        <>
          <Pressable accessibilityRole="button" style={[styles.btn, styles.btnGhost]} onPress={onClose}>
            <Text style={styles.btnGhostText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={[styles.btn, styles.btnPrimary]} onPress={handleConfirm}>
            <Text style={styles.btnPrimaryText}>确定</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.yearRow}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          disabled={pickedYear <= MIN_YEAR}
          onPress={() => setPickedYear((y) => Math.max(MIN_YEAR, y - 1))}
        >
          <ChevronLeftIcon size={20} color={pickedYear <= MIN_YEAR ? colors.textPlaceholder : colors.text} />
        </Pressable>
        <Text style={styles.yearText}>{pickedYear} 年</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          disabled={pickedYear >= MAX_YEAR}
          onPress={() => setPickedYear((y) => Math.min(MAX_YEAR, y + 1))}
        >
          <ChevronRightIcon size={20} color={pickedYear >= MAX_YEAR ? colors.textPlaceholder : colors.text} />
        </Pressable>
      </View>

      <View style={styles.monthGrid}>
        {MONTHS.map((m) => {
          const active = m === pickedMonth;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setPickedMonth(m)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{m} 月</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.tip}>首次还款日期指提前还款后的下一扣款日</Text>
    </PickerModal>
  );
};

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  yearText: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.textStrong,
    minWidth: 80,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    width: '31%',
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  tip: {
    marginTop: spacing.md,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: '#F2F4F8',
  },
  btnGhostText: {
    fontSize: fontSize.normal,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    fontSize: fontSize.normal,
    color: colors.white,
    fontWeight: '700',
  },
});
