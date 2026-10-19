/**
 * 统计页堆叠柱状图：前 12 期「本金 / 利息」构成（纯 SVG 绘制）
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors, fontSize, radius, shadow } from '../theme/theme';
import type { AmortizationRow } from '../types';

interface Props {
  rows: AmortizationRow[];
}

const CHART_W = 311;
const CHART_H = 168;
const BAR_W = 16;
const GAP = 8;
const TOP_PAD = 8;

export const StackedBarChart: React.FC<Props> = ({ rows }) => {
  const data = rows.slice(0, 12);
  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map((r) => r.payment));
  const plotH = CHART_H - TOP_PAD;
  const step = (CHART_W - 20) / data.length;
  const startX = 10;

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.chartPrincipal }]} />
          <Text style={styles.legendText}>月供本金</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.chartInterest }]} />
          <Text style={styles.legendText}>月供利息</Text>
        </View>
      </View>
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {/* 参考线 */}
        {[0.5, 1].map((ratio) => (
          <Line
            key={ratio}
            x1={0}
            y1={TOP_PAD + plotH * (1 - ratio)}
            x2={CHART_W}
            y2={TOP_PAD + plotH * (1 - ratio)}
            stroke={colors.divider}
            strokeWidth={1}
          />
        ))}
        {data.map((row, i) => {
          const totalH = (row.payment / maxTotal) * plotH;
          const interestH = (row.interest / maxTotal) * plotH;
          const principalH = totalH - interestH;
          const x = startX + i * step + (step - BAR_W) / 2;
          const yBase = TOP_PAD + plotH;
          return (
            <React.Fragment key={row.period}>
              <Rect
                x={x}
                y={yBase - principalH - interestH}
                width={BAR_W}
                height={interestH}
                rx={2}
                fill={colors.chartInterest}
              />
              <Rect
                x={x}
                y={yBase - principalH}
                width={BAR_W}
                height={principalH}
                rx={2}
                fill={colors.chartPrincipal}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.axisRow}>
        {data.map((row) => (
          <Text key={row.period} style={styles.axisLabel} numberOfLines={1}>
            {row.yearMonth.split('.')[1]}月
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 6,
  },
  axisLabel: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
  },
});
