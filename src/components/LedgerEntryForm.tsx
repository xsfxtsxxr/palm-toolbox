/**
 * 记一笔：支出 / 收入切换 + 金额 + 分类 + 日期 + 备注
 */
import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  CATEGORIES,
  MAX_AMOUNT,
  formatDateCN,
  nowTime,
  todayISO,
  validateAmount,
  type LedgerDraft,
  type LedgerRecord,
  type LedgerType,
} from '../utils/ledger';
import { fmtDecimal, fmtDecimalInput, parseMoney } from '../utils/format';
import { MonthPickerModal } from './MonthPickerModal';
import { PrimaryButton } from './PrimaryButton';
import { useToast } from './Toast';
import { CalendarIcon, ChevronRightIcon } from './icons/UIIcons';

interface Props {
  editing: LedgerRecord | null;
  recent: number[];
  onSave: (draft: LedgerDraft) => void;
  onCancelEdit: () => void;
}

const TYPES: { key: LedgerType; label: string }[] = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
];

const partsOf = (date: string) => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
  day: Number(date.slice(8, 10)),
});

export const LedgerEntryForm: React.FC<Props> = ({ editing, recent, onSave, onCancelEdit }) => {
  const { showToast } = useToast();

  const [type, setType] = useState<LedgerType>(editing?.type ?? 'expense');
  const [amountText, setAmountText] = useState(editing ? fmtDecimal(editing.amount, 2) : '');
  const [category, setCategory] = useState(editing?.category ?? CATEGORIES.expense[0].id);
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [note, setNote] = useState(editing?.note ?? '');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const dateParts = partsOf(date);
  const categories = CATEGORIES[type];

  const switchType = (next: LedgerType) => {
    if (next === type) return;
    setType(next);
    setCategory(CATEGORIES[next][0].id);
  };

  const handleSave = () => {
    const amount = parseMoney(amountText);
    const error = validateAmount(amount);
    if (error) {
      showToast(error);
      return;
    }

    Keyboard.dismiss();
    onSave({
      type,
      amount,
      category,
      date,
      time: editing?.time ?? nowTime(),
      note,
    });

    if (!editing) {
      setAmountText('');
      setNote('');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {editing ? (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>
            正在编辑 {formatDateCN(editing.date)} 的{editing.type === 'expense' ? '支出' : '收入'}记录
          </Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onCancelEdit}>
            <Text style={styles.cancelEdit}>取消</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 支出 / 收入 */}
      <View style={styles.segment}>
        {TYPES.map((item) => {
          const active = item.key === type;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => switchType(item.key)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 金额 */}
      <View style={[styles.amountCard, shadow.card]}>
        <View style={styles.amountHeader}>
          <Text style={styles.amountLabel}>金额</Text>
          <Text style={styles.amountLimit}>单笔上限 ¥{fmtDecimal(MAX_AMOUNT, 2)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>¥</Text>
          <TextInput
            style={styles.amountInput}
            value={amountText}
            onChangeText={(text) => setAmountText(fmtDecimalInput(text, 2))}
            placeholder="0.00"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="decimal-pad"
            maxLength={12}
          />
        </View>

        {recent.length > 0 ? (
          <View style={styles.quickRow}>
            <Text style={styles.quickLabel}>最近金额</Text>
            {recent.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                style={styles.quickChip}
                onPress={() => setAmountText(fmtDecimal(value, 2))}
              >
                <Text style={styles.quickChipText}>{fmtDecimal(value, 2)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* 分类 */}
      <View style={[styles.card, shadow.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>分类</Text>
          <Text style={styles.cardHint}>{categories.length} 类</Text>
        </View>
        <View style={styles.grid}>
          {categories.map((item) => {
            const active = item.id === category;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                style={[styles.categoryItem, active && styles.categoryItemActive]}
                onPress={() => setCategory(item.id)}
              >
                <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                  <Text style={styles.categoryEmoji}>{item.icon}</Text>
                </View>
                <Text style={[styles.categoryName, active && styles.categoryNameActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 日期 / 备注 */}
      <View style={[styles.card, styles.fieldCard, shadow.card]}>
        <Pressable
          accessibilityRole="button"
          style={styles.fieldRow}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={styles.fieldLabel}>日期</Text>
          <View style={styles.fieldValue}>
            <Text style={styles.fieldValueText}>{date.replace(/-/g, '.')}</Text>
            <CalendarIcon size={17} color={colors.primary} />
            <ChevronRightIcon size={15} color={colors.textTertiary} />
          </View>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>备注</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="选填，如：午饭"
            placeholderTextColor={colors.textPlaceholder}
            maxLength={30}
            returnKeyType="done"
          />
        </View>
      </View>

      <PrimaryButton title={editing ? '保存修改' : '保存记录'} onPress={handleSave} style={styles.saveBtn} />

      {editing ? (
        <Pressable accessibilityRole="button" style={styles.cancelBtn} onPress={onCancelEdit}>
          <Text style={styles.cancelBtnText}>放弃修改</Text>
        </Pressable>
      ) : null}

      <Text style={styles.tip}>记录保存在本机，卸载应用会一并清除</Text>

      <MonthPickerModal
        key={datePickerVisible ? `ledger-date-${date}` : 'ledger-date-closed'}
        visible={datePickerVisible}
        year={dateParts.year}
        month={dateParts.month}
        day={dateParts.day}
        title="选择记账日期"
        tip="默认今天，可改为实际消费 / 收入日期"
        minYear={2000}
        maxYear={2050}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(year, month, day) =>
          setDate(
            `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          )
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  editBanner: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E7F2EF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  editBannerText: {
    flex: 1,
    fontSize: fontSize.mini,
    color: '#3F6B5E',
  },
  cancelEdit: {
    fontSize: fontSize.mini,
    fontWeight: '700',
    color: colors.primary,
  },

  /* 支出 / 收入 */
  segment: {
    marginTop: spacing.md,
    flexDirection: 'row',
    height: 46,
    backgroundColor: '#E9EDF3',
    borderRadius: radius.md,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: fontSize.normal,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  /* 金额 */
  amountCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  amountLimit: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currency: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.xs,
    marginTop: 6,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 38,
    fontWeight: '800',
    color: colors.textStrong,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  quickRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickLabel: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  quickChip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: '#EAF4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
  },

  /* 分类 */
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.normal,
    fontWeight: '700',
    color: '#2C3A36',
  },
  cardHint: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '31.5%',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#F7F9F8',
    alignItems: 'center',
  },
  categoryItemActive: {
    borderColor: '#9CC9B9',
    backgroundColor: '#F1FAF6',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    backgroundColor: '#DCEFE8',
  },
  categoryEmoji: {
    fontSize: 19,
  },
  categoryName: {
    marginTop: 6,
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  categoryNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* 日期 / 备注 */
  fieldCard: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  fieldRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: fontSize.normal,
    color: colors.text,
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldValueText: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  noteInput: {
    flex: 1,
    marginLeft: spacing.lg,
    paddingVertical: 8,
    textAlign: 'right',
    fontSize: fontSize.normal,
    color: colors.textStrong,
  },

  saveBtn: {
    marginTop: spacing.xl,
  },
  cancelBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: fontSize.body,
    color: colors.textTertiary,
  },
  tip: {
    marginTop: spacing.md,
    fontSize: fontSize.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
