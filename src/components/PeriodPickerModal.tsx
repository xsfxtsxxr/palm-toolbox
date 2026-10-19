/**
 * 剩余期数选择器（预设 + 自定义）
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { PERIOD_PRESETS } from '../data/tools';
import { PickerModal } from './PickerModal';

interface Props {
  visible: boolean;
  months: number;
  onClose: () => void;
  onConfirm: (months: number) => void;
}

export const PeriodPickerModal: React.FC<Props> = ({ visible, months, onClose, onConfirm }) => {
  const [picked, setPicked] = useState(months);
  const [custom, setCustom] = useState('');

  const handleConfirm = () => {
    onConfirm(picked);
    onClose();
  };

  return (
    <PickerModal
      visible={visible}
      title="选择剩余期数"
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
      <View style={styles.grid}>
        {PERIOD_PRESETS.map((preset) => {
          const active = picked === preset && !custom;
          return (
            <Pressable
              key={preset}
              accessibilityRole="button"
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setPicked(preset);
                setCustom('');
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{preset} 期</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <Text style={styles.customLabel}>自定义</Text>
        <TextInput
          style={styles.customInput}
          value={custom}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '').slice(0, 3);
            setCustom(cleaned);
            const value = parseInt(cleaned, 10);
            if (!isNaN(value) && value > 0 && value <= 600) setPicked(value);
          }}
          keyboardType="number-pad"
          placeholder="输入期数（1-600）"
          placeholderTextColor={colors.textPlaceholder}
          maxLength={3}
        />
        <Text style={styles.customUnit}>月</Text>
      </View>
    </PickerModal>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: '22%',
    flexGrow: 1,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
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
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  customLabel: {
    fontSize: fontSize.normal,
    color: colors.text,
    fontWeight: '600',
  },
  customInput: {
    flex: 1,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    paddingHorizontal: spacing.md,
    fontSize: fontSize.normal,
    color: colors.textStrong,
  },
  customUnit: {
    fontSize: fontSize.normal,
    color: colors.textSecondary,
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
