/**
 * 快捷添加栏：输入内容回车即创建，自动识别日期 / 时间 / 优先级
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import { formatDateLabel, parseQuickInput, priorityOf } from '../utils/todo';

interface Props {
  today: string;
  onAdd: (text: string) => void;
  /** 打开详情页新建（可精确设置日期 / 时间 / 优先级 / 分类） */
  onDetail: () => void;
}

export const TodoQuickAdd: React.FC<Props> = ({ today, onAdd, onDetail }) => {
  const [text, setText] = useState('');

  const parsed = parseQuickInput(text, today);
  const recognize = Boolean(text.trim()) && (parsed.dateMatched || parsed.timeMatched || parsed.priority !== 'medium');

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.hintRow}>
        {recognize ? (
          <>
            <Text style={styles.previewTag}>识别为</Text>
            <Text style={styles.previewText} numberOfLines={1}>
              {formatDateLabel(parsed.date, today)}
              {parsed.time ? ` ${parsed.time}` : ''}
              {parsed.priority !== 'medium' ? ` · ${priorityOf(parsed.priority).label}` : ''}
              {parsed.content ? ` · ${parsed.content}` : ''}
            </Text>
          </>
        ) : (
          <Text style={styles.hint} numberOfLines={1}>
            回车即添加，支持「明天下午3点开会」
          </Text>
        )}

        <Pressable accessibilityRole="button" hitSlop={8} onPress={onDetail}>
          <Text style={styles.detailLink}>详细设置 ›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="添加待办，回车即创建…"
          placeholderTextColor={colors.textPlaceholder}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={submit}
          blurOnSubmit={false}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="添加待办"
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          onPress={submit}
        >
          <Text style={styles.addIcon}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingLeft: 2,
  },
  hint: {
    flex: 1,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  detailLink: {
    fontSize: fontSize.mini,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 'auto',
  },
  previewTag: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: '#4F8C7A',
    backgroundColor: '#E7F2EF',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  previewText: {
    flex: 1,
    fontSize: fontSize.mini,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F3F5F5',
    fontSize: fontSize.normal,
    color: colors.textStrong,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: {
    backgroundColor: colors.primaryPressed,
  },
  addIcon: {
    marginTop: -2,
    fontSize: 26,
    fontWeight: '600',
    color: colors.white,
  },
});
