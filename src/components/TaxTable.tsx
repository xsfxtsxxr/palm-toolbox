/** 年度扣税明细表：月份 / 本月扣税 / 累计扣税 / 到手工资 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius } from '../theme/theme';
import { fmtDecimal, fmtMoney } from '../utils/format';
import type { TaxResult } from '../utils/tax';

interface Props {
  result: TaxResult;
}

const money = (value: number) =>
  Math.abs(value % 1) < 0.005 ? `¥${fmtMoney(value)}` : `¥${fmtDecimal(value, 2)}`;

export const TaxTable: React.FC<Props> = ({ result }) => (
  <View style={styles.table}>
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.monthCol]}>月份</Text>
      <Text style={[styles.headerCell, styles.taxCol]}>本月扣税</Text>
      <Text style={[styles.headerCell, styles.cumulativeCol]}>累计扣税</Text>
      <Text style={[styles.headerCell, styles.netCol]}>到手工资</Text>
    </View>

    {result.schedule.map((row, index) => (
      <View key={row.month} style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
        <Text style={[styles.cell, styles.monthCol, styles.monthText]} numberOfLines={1}>
          {row.month}月
        </Text>
        <Text style={[styles.cell, styles.taxCol]} numberOfLines={1}>
          {money(row.tax)}
        </Text>
        <Text style={[styles.cell, styles.cumulativeCol]} numberOfLines={1}>
          {money(row.cumulativeTax)}
        </Text>
        <Text style={[styles.cell, styles.netCol]} numberOfLines={1}>
          {money(row.netIncome)}
        </Text>
      </View>
    ))}

    <View style={styles.totalRow}>
      <Text style={[styles.totalCell, styles.monthCol]} numberOfLines={1}>
        合计
      </Text>
      <Text style={[styles.totalCell, styles.taxCol]} numberOfLines={1}>
        {money(result.annualTax)}
      </Text>
      <Text style={[styles.totalCell, styles.cumulativeCol]} numberOfLines={1}>
        {money(result.annualTax)}
      </Text>
      <Text style={[styles.totalCell, styles.netCol]} numberOfLines={1}>
        {money(result.annualNet)}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  table: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9EFEC',
    backgroundColor: colors.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
  },
  rowAlt: {
    backgroundColor: '#F7FAF9',
  },
  cell: {
    fontSize: fontSize.body,
    color: '#3B4744',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  monthText: {
    textAlign: 'left',
    fontWeight: '600',
    color: colors.textStrong,
  },
  monthCol: {
    flex: 0.72,
    textAlign: 'left',
  },
  taxCol: {
    flex: 1,
  },
  cumulativeCol: {
    flex: 1,
  },
  netCol: {
    flex: 1.18,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 10,
    backgroundColor: '#E7F2EF',
    borderTopWidth: 1,
    borderTopColor: '#D6E6E0',
  },
  totalCell: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
