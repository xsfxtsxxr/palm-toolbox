/**
 * 待办卡片行：勾选完成、左滑编辑 / 删除、长按进入多选
 */
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/theme';
import {
  categoryOfTodo,
  formatDateLabel,
  isOverdue,
  priorityOf,
  type Todo,
} from '../utils/todo';
import { createSwipeRow } from './swipeRow';
import { EditIcon, TrashIcon } from './icons/UIIcons';

interface Props {
  todo: Todo;
  today: string;
  selecting: boolean;
  selected: boolean;
  onToggle: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onLongPress: (todo: Todo) => void;
  onSelect: (todo: Todo) => void;
}

export const TodoRow: React.FC<Props> = ({
  todo,
  today,
  selecting,
  selected,
  onToggle,
  onOpen,
  onDelete,
  onLongPress,
  onSelect,
}) => {
  const [swipe] = useState(createSwipeRow);
  const [checkbox] = useState(() => new Animated.Value(1));

  const overdue = isOverdue(todo, today);
  const priority = priorityOf(todo.priority);
  const category = categoryOfTodo(todo.category);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(checkbox, { toValue: 1.3, duration: 90, useNativeDriver: true }),
      Animated.spring(checkbox, { toValue: 1, bounciness: 6, useNativeDriver: true }),
    ]).start();
    onToggle(todo);
  };

  return (
    <View style={[styles.wrap, overdue && !selecting && styles.wrapOverdue]}>
      {/* 左滑操作 */}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.action, styles.editAction]}
          onPress={() => onOpen(todo)}
        >
          <EditIcon size={17} color={colors.primary} />
          <Text style={styles.editText}>编辑</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.action, styles.deleteAction]}
          onPress={() => onDelete(todo)}
        >
          <TrashIcon size={17} color={colors.white} />
          <Text style={styles.deleteText}>删除</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.content,
          overdue && !selecting && styles.contentOverdue,
          { transform: [{ translateX: swipe.translateX }] },
        ]}
        {...(selecting ? {} : swipe.panHandlers)}
      >
        {overdue && !selecting ? <View style={styles.overdueBar} /> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${todo.completed ? '已完成' : '待办'}：${todo.content}`}
          style={styles.main}
          onPress={() => {
            if (selecting) {
              onSelect(todo);
              return;
            }
            if (swipe.isOpen()) {
              swipe.close();
              return;
            }
            onOpen(todo);
          }}
          onLongPress={() => {
            if (!selecting) onLongPress(todo);
          }}
          delayLongPress={320}
        >
          <Animated.View style={{ transform: [{ scale: checkbox }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={todo.completed ? '取消完成' : '标记完成'}
              hitSlop={8}
              style={styles.checkboxHit}
              onPress={() => {
                if (selecting) {
                  onSelect(todo);
                  return;
                }
                handleToggle();
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  todo.completed && styles.checkboxDone,
                  selecting && selected && styles.checkboxSelected,
                ]}
              >
                {todo.completed || (selecting && selected) ? (
                  <Text style={styles.check}>✓</Text>
                ) : null}
              </View>
            </Pressable>
          </Animated.View>

          <View style={styles.middle}>
            <Text
              style={[styles.content_, todo.completed && styles.contentDone]}
              numberOfLines={2}
            >
              {todo.content}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.meta, overdue && styles.metaOverdue]}>
                {formatDateLabel(todo.date, today)}
                {todo.time ? ` ${todo.time}` : ''}
              </Text>

              {category ? (
                <View style={[styles.categoryTag, { backgroundColor: category.bg }]}>
                  <Text style={[styles.categoryText, { color: category.color }]}>
                    {category.label}
                  </Text>
                </View>
              ) : null}

              {overdue ? <Text style={styles.overdueTag}>已过期</Text> : null}
            </View>
          </View>

          <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  wrapOverdue: {
    backgroundColor: '#FFF8F1',
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 144,
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
    backgroundColor: colors.card,
  },
  contentOverdue: {
    backgroundColor: '#FFF8F1',
  },
  overdueBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
  },
  main: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkboxHit: {
    padding: 2,
    marginRight: spacing.md,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: radius.pill,
    borderWidth: 1.8,
    borderColor: '#C3D2CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  check: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
    marginTop: -1,
  },
  middle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  content_: {
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
    lineHeight: 20,
  },
  contentDone: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
  metaOverdue: {
    color: colors.orange,
    fontWeight: '600',
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  categoryText: {
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  overdueTag: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.orange,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
