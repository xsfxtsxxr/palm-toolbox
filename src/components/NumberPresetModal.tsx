/**
 * 通用数值预设选择器（收益率 / 万份收益 / 持有天数等）
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { sanitizeRateInput } from '../utils/format';
import { PickerModal } from './PickerModal';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  visible: boolean;
  title: string;
  value: number;
  presets: number[];
  /** 单位：% / 元 / 天 */
  suffix?: string;
  /** 小数位，0 表示整数 */
  decimals?: number;
  /** 自定义输入上限 */
  max?: number;
  hint?: string;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

export const NumberPresetModal: React.FC<Props> = ({
  visible,
  title,
  value,
  presets,
  suffix = '',
  decimals = 2,
  max = 10_000,
  hint,
  onClose,
  onConfirm,
}) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const isPreset = presets.some((item) => item === value);
  const [picked, setPicked] = useState(value);
  const [custom, setCustom] = useState(isPreset ? '' : String(value));

  const customValue = parseFloat(custom);
  const customValid =
    !isNaN(customValue) &&
    customValue > 0 &&
    customValue <= max &&
    (decimals > 0 || Number.isInteger(customValue));

  const format = (num: number) =>
    suffix === '%' ? `${num.toFixed(decimals)}%` : `${num.toFixed(decimals)} ${suffix}`.trim();

  const handleConfirm = () => {
    if (customValid) onConfirm(customValue);
    else if (picked > 0) onConfirm(picked);
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
          <Pressable
            accessibilityRole="button"
            style={[styles.btn, styles.btnPrimary, !customValid && picked <= 0 ? styles.btnDisabled : null]}
            onPress={handleConfirm}
          >
            <Text style={styles.btnPrimaryText}>确定</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.grid}>
        {presets.map((preset) => {
          const active = !customValid && picked === preset;
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
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{format(preset)}</Text>
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
            onChangeText={(text) =>
              setCustom(decimals > 0 ? sanitizeRateInput(text, 6) : text.replace(/\D/g, '').slice(0, 4))
            }
            keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
            placeholder={`输入${title}`}
            placeholderTextColor={colors.textPlaceholder}
          />
          {suffix ? <Text style={styles.customUnit}>{suffix}</Text> : null}
        </View>
      </View>

      {hint ? <Text style={styles.tip}>{hint}</Text> : null}
    </PickerModal>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    width: '31%',
    flexGrow: 1,
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
    fontWeight: '700',
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
