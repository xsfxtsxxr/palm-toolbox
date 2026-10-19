/** 还款计划页统计卡片（原月供 / 新月供 / 节省利息） */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, shadow } from '../theme/theme';
import { fmtYuan } from '../utils/format';

interface Props {
  label: string;
  value: number;
  highlight?: boolean;
}

export const StatCard: React.FC<Props> = ({ label, value, highlight }) => (
  <View style={[styles.card, shadow.card]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight && styles.valueHighlight]} numberOfLines={1}>
      {fmtYuan(value)}
    </Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },
  value: {
    marginVertical: 4,
    fontSize: fontSize.h1,
    fontWeight: '800',
    color: colors.textStrong,
  },
  valueHighlight: {
    color: colors.primary,
  },
});
