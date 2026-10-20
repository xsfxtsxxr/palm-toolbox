/** 单位选择器（长度 / 重量共用） */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import type { UnitDef } from '../utils/unit';
import { PickerModal } from './PickerModal';

interface Props {
  visible: boolean;
  title: string;
  units: UnitDef[];
  selected: string;
  onClose: () => void;
  onSelect: (code: string) => void;
}

export const UnitPickerModal: React.FC<Props> = ({
  visible,
  title,
  units,
  selected,
  onClose,
  onSelect,
}) => (
  <PickerModal visible={visible} title={title} onClose={onClose}>
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
      {units.map((unit, index) => {
        const active = unit.code === selected;
        return (
          <Pressable
            key={unit.code}
            accessibilityRole="button"
            onPress={() => {
              onSelect(unit.code);
              onClose();
            }}
            style={({ pressed }) => [
              styles.row,
              index === units.length - 1 && styles.rowLast,
              active && styles.rowActive,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={[styles.symbol, active && styles.symbolActive]}>{unit.symbol}</Text>
            <Text style={[styles.name, active && styles.nameActive]}>{unit.name}</Text>
            {active ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  </PickerModal>
);

const styles = StyleSheet.create({
  list: {
    maxHeight: 380,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
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
  symbol: {
    width: 64,
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: colors.textStrong,
  },
  symbolActive: {
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
