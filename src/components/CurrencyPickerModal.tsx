/** 币种选择器（全量币种 / 常用币种共用） */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { currencyName } from '../utils/currency';
import { PickerModal } from './PickerModal';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  visible: boolean;
  title: string;
  selected: string;
  codes: string[];
  onClose: () => void;
  onSelect: (code: string) => void;
}

export const CurrencyPickerModal: React.FC<Props> = ({
  visible,
  title,
  selected,
  codes,
  onClose,
  onSelect,
}) => {
  const styles = useThemedStyles(makeStyles);
  return (
  <PickerModal visible={visible} title={title} onClose={onClose}>
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {codes.map((code, index) => {
        const active = code === selected;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            onPress={() => {
              onSelect(code);
              onClose();
            }}
            style={({ pressed }) => [
              styles.row,
              index === codes.length - 1 && styles.rowLast,
              active && styles.rowActive,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={[styles.code, active && styles.codeActive]}>{code}</Text>
            <Text style={[styles.name, active && styles.nameActive]}>{currencyName(code)}</Text>
            {active ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  </PickerModal>
);
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    borderRadius: radius.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowActive: {
    backgroundColor: '#EAF4F0',
  },
  rowPressed: {
    backgroundColor: '#F3F6F5',
  },
  code: {
    width: 52,
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.textStrong,
  },
  codeActive: {
    color: colors.primary,
  },
  name: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  nameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 4,
  },
});
