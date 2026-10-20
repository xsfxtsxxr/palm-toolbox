/**
 * 时间选择器（小时 + 分钟，5 分钟步进）
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { PickerModal } from './PickerModal';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  visible: boolean;
  /** HH:mm，空串表示未设置 */
  value: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const pad2 = (value: number) => String(value).padStart(2, '0');

export const TimePickerModal: React.FC<Props> = ({ visible, value, onClose, onConfirm }) => {
  const styles = useThemedStyles(makeStyles);

  const initialHour = value ? Number(value.slice(0, 2)) : 9;
  const initialMinute = value ? Number(value.slice(3, 5)) : 0;

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(MINUTES.includes(initialMinute) ? initialMinute : 0);

  return (
    <PickerModal
      visible={visible}
      title="选择提醒时间"
      onClose={onClose}
      footer={
        <>
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnGhost]}
            onPress={() => {
              onConfirm('');
              onClose();
            }}
          >
            <Text style={styles.btnGhostText}>不设置</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => {
              onConfirm(`${pad2(hour)}:${pad2(minute)}`);
              onClose();
            }}
          >
            <Text style={styles.btnPrimaryText}>确定</Text>
          </Pressable>
        </>
      }
    >
      <Text style={styles.preview}>
        {pad2(hour)}:{pad2(minute)}
      </Text>

      <Text style={styles.label}>小时</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourRow}>
        {HOURS.map((item) => {
          const active = item === hour;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              style={[styles.hourChip, active && styles.chipActive]}
              onPress={() => setHour(item)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{pad2(item)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>分钟</Text>
      <View style={styles.minuteGrid}>
        {MINUTES.map((item) => {
          const active = item === minute;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              style={[styles.minuteChip, active && styles.chipActive]}
              onPress={() => setMinute(item)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{pad2(item)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.tip}>分钟按 5 分钟步进，不设置时间则只按日期提醒</Text>
    </PickerModal>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  preview: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  hourRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  hourChip: {
    width: 46,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  minuteChip: {
    width: '15.5%',
    height: 32,
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
    fontVariant: ['tabular-nums'],
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
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
