/**
 * 流水记录行：左滑露出「编辑 / 删除」，点击进入编辑
 */
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { categoryOf, type LedgerRecord } from '../utils/ledger';
import { fmtDecimal } from '../utils/format';
import { ACTION_WIDTH, createSwipeRow } from './swipeRow';
import { EditIcon, TrashIcon } from './icons/UIIcons';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  record: LedgerRecord;
  onPress: (record: LedgerRecord) => void;
  onEdit: (record: LedgerRecord) => void;
  onDelete: (record: LedgerRecord) => void;
}

export const LedgerRow: React.FC<Props> = ({ record, onPress, onEdit, onDelete }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const [swipe] = useState(createSwipeRow);
  const { translateX, panHandlers } = swipe;

  const category = categoryOf(record.type, record.category);
  const expense = record.type === 'expense';

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.action, styles.editAction]}
          onPress={() => onEdit(record)}
        >
          <EditIcon size={17} color={colors.primary} />
          <Text style={styles.editText}>编辑</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.action, styles.deleteAction]}
          onPress={() => onDelete(record)}
        >
          <TrashIcon size={17} color={colors.white} />
          <Text style={styles.deleteText}>删除</Text>
        </Pressable>
      </View>

      <Animated.View style={[styles.content, { transform: [{ translateX }] }]} {...panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${category.name} ${expense ? '支出' : '收入'} ${record.amount} 元`}
          style={styles.main}
          onPress={() => {
            if (swipe.isOpen()) {
              swipe.close();
              return;
            }
            onPress(record);
          }}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${category.color}1A` }]}>
            <Text style={styles.icon}>{record.categoryIcon}</Text>
          </View>

          <View style={styles.middle}>
            <Text style={styles.category}>{category.name}</Text>
            {record.note ? (
              <Text style={styles.note} numberOfLines={1}>
                {record.note}
              </Text>
            ) : null}
          </View>

          <View style={styles.right}>
            <Text style={[styles.amount, expense ? styles.expense : styles.income]}>
              {expense ? '-' : '+'}¥{fmtDecimal(record.amount, 2)}
            </Text>
            <Text style={styles.time}>{record.time}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  wrap: {
    height: 66,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  editAction: {
    backgroundColor: '#DCEFE8',
  },
  editText: {
    fontSize: fontSize.mini,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteAction: {
    backgroundColor: colors.red,
  },
  deleteText: {
    fontSize: fontSize.mini,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.card,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  middle: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  category: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  note: {
    marginTop: 2,
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  expense: {
    color: colors.red,
  },
  income: {
    color: colors.green,
  },
  time: {
    marginTop: 2,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
});
