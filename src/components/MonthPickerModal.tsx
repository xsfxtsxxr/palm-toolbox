/**
 * 日期选择器（年 + 月 + 日），默认用于「首次还款日期」
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/UIIcons';
import { PickerModal } from './PickerModal';

interface Props {
  visible: boolean;
  year: number;
  month: number;
  day: number;
  onClose: () => void;
  onConfirm: (year: number, month: number, day: number) => void;
  /** 弹窗标题 */
  title?: string;
  /** 底部提示文案 */
  tip?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const MonthPickerModal: React.FC<Props> = ({
  visible,
  year,
  month,
  day,
  onClose,
  onConfirm,
  title = '选择首次还款日期',
  tip = '首次还款日期指提前还款后的下一扣款日',
  minYear = 2015,
  maxYear = 2045,
}) => {
  const [pickedYear, setPickedYear] = useState(year);
  const [pickedMonth, setPickedMonth] = useState(month);
  const [pickedDay, setPickedDay] = useState(day);

  const handleConfirm = () => {
    onConfirm(pickedYear, pickedMonth, pickedDay);
    onClose();
  };

  return (
    <PickerModal
      visible={visible}
      title={title}
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
          disabled={pickedYear <= minYear}
          onPress={() => {
            const nextYear = Math.max(minYear, pickedYear - 1);
            setPickedYear(nextYear);
            setPickedDay((value) => Math.min(value, new Date(nextYear, pickedMonth, 0).getDate()));
          }}
        >
          <ChevronLeftIcon size={20} color={pickedYear <= minYear ? colors.textPlaceholder : colors.text} />
        </Pressable>
        <Text style={styles.yearText}>{pickedYear} 年</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          disabled={pickedYear >= maxYear}
          onPress={() => {
            const nextYear = Math.min(maxYear, pickedYear + 1);
            setPickedYear(nextYear);
            setPickedDay((value) => Math.min(value, new Date(nextYear, pickedMonth, 0).getDate()));
          }}
        >
          <ChevronRightIcon size={20} color={pickedYear >= maxYear ? colors.textPlaceholder : colors.text} />
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
              onPress={() => {
                setPickedMonth(m);
                setPickedDay((value) => Math.min(value, new Date(pickedYear, m, 0).getDate()));
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{m} 月</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.dayScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <View style={styles.dayGrid}>
          {Array.from({ length: new Date(pickedYear, pickedMonth, 0).getDate() }, (_, index) => index + 1).map((d) => {
            const active = d === pickedDay;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                style={[styles.dayChip, active && styles.chipActive]}
                onPress={() => setPickedDay(d)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d} 日</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.tip}>{tip}</Text>
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
  dayScroll: {
    maxHeight: 230,
    marginTop: spacing.md,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayChip: {
    width: '31%',
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
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
