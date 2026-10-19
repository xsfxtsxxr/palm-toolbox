/**
 * 贷款年利率选择器（预设 + 自定义）
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { RATE_PRESETS } from '../data/tools';
import { fmtPercent } from '../utils/format';
import { PickerModal } from './PickerModal';

interface Props {
  visible: boolean;
  rate: number;
  onClose: () => void;
  onConfirm: (rate: number) => void;
}

export const RatePickerModal: React.FC<Props> = ({ visible, rate, onClose, onConfirm }) => {
  const [picked, setPicked] = useState(rate);
  const [custom, setCustom] = useState('');

  const customValue = parseFloat(custom);
  const customValid = !isNaN(customValue) && customValue > 0 && customValue <= 24;

  const handleConfirm = () => {
    onConfirm(picked);
    onClose();
  };

  return (
    <PickerModal
      visible={visible}
      title="选择贷款年利率"
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
        {RATE_PRESETS.map((preset) => {
          const active = picked === preset && !customValid;
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
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{fmtPercent(preset)}</Text>
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
            const cleaned = text.replace(/[^\d.]/g, '');
            setCustom(cleaned);
            const value = parseFloat(cleaned);
            if (!isNaN(value) && value > 0 && value <= 24) setPicked(value);
          }}
          keyboardType="decimal-pad"
          placeholder="输入利率"
          placeholderTextColor={colors.textPlaceholder}
          maxLength={5}
        />
        <Text style={styles.customUnit}>%</Text>
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
