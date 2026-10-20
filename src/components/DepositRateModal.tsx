/**
 * 存款利率选择器（常见挂牌利率预设 + 自定义）
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { DEPOSIT_RATE_PRESETS } from '../data/tools';
import { fmtPercent, sanitizeRateInput } from '../utils/format';
import { PickerModal } from './PickerModal';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  visible: boolean;
  rate: number;
  onClose: () => void;
  onConfirm: (rate: number) => void;
}

export const DepositRateModal: React.FC<Props> = ({ visible, rate, onClose, onConfirm }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const isPreset = DEPOSIT_RATE_PRESETS.some((item) => item.rate === rate);
  const [picked, setPicked] = useState(rate);
  const [custom, setCustom] = useState(isPreset ? '' : String(rate));

  const customValue = parseFloat(custom);
  const customValid = !isNaN(customValue) && customValue > 0 && customValue <= 24;

  const handleConfirm = () => {
    if (customValid) onConfirm(customValue);
    else if (picked > 0) onConfirm(picked);
    onClose();
  };

  return (
    <PickerModal
      visible={visible}
      title="常用存款利率"
      onClose={onClose}
      footer={
        <>
          <Pressable accessibilityRole="button" style={[styles.btn, styles.btnGhost]} onPress={onClose}>
            <Text style={styles.btnGhostText}>取消</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnPrimary, (!customValid && picked <= 0) ? styles.btnDisabled : null]}
            onPress={handleConfirm}
          >
            <Text style={styles.btnPrimaryText}>确定</Text>
          </Pressable>
        </>
      }
    >
      <Text style={styles.sectionHint}>人民币定期存款挂牌利率参考，点击即可填入</Text>

      <View style={styles.grid}>
        {DEPOSIT_RATE_PRESETS.map((preset) => {
          const active = !customValid && picked === preset.rate;
          return (
            <Pressable
              key={preset.label}
              accessibilityRole="button"
              style={[styles.preset, active && styles.presetActive]}
              onPress={() => {
                setPicked(preset.rate);
                setCustom('');
              }}
            >
              <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>{preset.label}</Text>
              <Text style={[styles.presetRate, active && styles.presetRateActive]}>{fmtPercent(preset.rate)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <Text style={styles.customLabel}>自定义</Text>
        <View style={styles.customInputWrap}>
          <TextInput
            style={styles.customInput}
            value={custom}
            onChangeText={(text) => {
              const cleaned = sanitizeRateInput(text);
              setCustom(cleaned);
              const value = parseFloat(cleaned);
              if (!isNaN(value) && value > 0 && value <= 24) setPicked(value);
            }}
            keyboardType="decimal-pad"
            placeholder="输入实际执行利率"
            placeholderTextColor={colors.textPlaceholder}
            maxLength={5}
          />
          <Text style={styles.customUnit}>%</Text>
        </View>
      </View>

      <Text style={styles.tip}>预设利率仅供参考，实际以银行当日挂牌利率为准</Text>
    </PickerModal>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  sectionHint: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preset: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    paddingHorizontal: spacing.md,
  },
  presetActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  presetLabel: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  presetLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  presetRate: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textStrong,
  },
  presetRateActive: {
    color: colors.primary,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  customLabel: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.text,
  },
  customInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F8',
    paddingHorizontal: spacing.md,
  },
  customInput: {
    flex: 1,
    fontSize: fontSize.normal,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  customUnit: {
    fontSize: fontSize.normal,
    color: colors.textSecondary,
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
  btnDisabled: {
    opacity: 0.4,
  },
});
