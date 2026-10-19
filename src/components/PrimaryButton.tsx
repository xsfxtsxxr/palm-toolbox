/** 主操作按钮（深 Teal 大按钮，与设计稿一致） */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontSize, radius } from '../theme/theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<Props> = ({ title, onPress, disabled, loading, style }) => (
  <Pressable
    accessibilityRole="button"
    style={({ pressed }) => [
      styles.button,
      pressed && !disabled ? styles.pressed : null,
      disabled ? styles.disabled : null,
      style,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={colors.white} size="small" />
    ) : (
      <Text style={styles.text}>{title}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  disabled: {
    backgroundColor: '#B9C6D2',
  },
  text: {
    color: colors.white,
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
