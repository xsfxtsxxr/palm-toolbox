/** 工具箱卡片（首页 3×3 网格单元） */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadow, tileThemes } from '../theme/theme';
import type { Tool } from '../types';
import { ToolIcon } from './icons/ToolIcons';

interface Props {
  tool: Tool;
  onPress: (tool: Tool) => void;
}

export const ToolCard: React.FC<Props> = ({ tool, onPress }) => {
  const tile = tileThemes[tool.tile];
  const highlighted = Boolean(tool.hot);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        highlighted && styles.cardHighlighted,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(tool)}
    >
      <View style={[styles.tile, { backgroundColor: tile.bg }]}>
        <ToolIcon name={tool.icon} size={30} color={tile.color} />
      </View>
      {highlighted ? (
        <View style={styles.hotBadge}>
          <Text style={styles.hotText}>热门</Text>
        </View>
      ) : null}
      <Text style={styles.name} numberOfLines={1}>
        {tool.name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {tool.subtitle}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadow.card,
  },
  cardHighlighted: {
    borderColor: '#3E7BFA',
    backgroundColor: '#F6FAFF',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hotText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
  name: {
    marginTop: 10,
    fontSize: fontSize.normal,
    fontWeight: '600',
    color: colors.textStrong,
  },
  subtitle: {
    marginTop: 2,
    fontSize: fontSize.mini,
    color: colors.textTertiary,
  },
});
