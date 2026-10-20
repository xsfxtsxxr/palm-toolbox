/**
 * 还款计划明细表（期数 / 月供总额 / 月供本金 / 月供利息 / 剩余总额）
 * 默认展示 12 期，可展开全部期数
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius } from '../theme/theme';
import type { AmortizationRow } from '../types';
import { fmtMoney } from '../utils/format';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/UIIcons';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  rows: AmortizationRow[];
  previewCount?: number;
}

const COLUMNS = ['还款日', '月供总额', '月供本金', '月供利息', '剩余总额'];

export const AmortizationTable: React.FC<Props> = ({ rows, previewCount = 12 }) => {
  const colors = useThemeColors();
  const styles = useThemedStyles(makeStyles);

  const [expanded, setExpanded] = useState(false);
  const displayRows = useMemo(
    () => (expanded ? rows : rows.slice(0, previewCount)),
    [expanded, rows, previewCount],
  );

  return (
    <View style={styles.container}>
      {/* 表头 */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.periodCell]}>{COLUMNS[0]}</Text>
        {COLUMNS.slice(1).map((col) => (
          <Text key={col} style={styles.headerCell}>
            {col}
          </Text>
        ))}
      </View>

      {/* 表体：展开时使用内部滚动，未展开时平铺 */}
      {expanded ? (
        <ScrollView style={styles.bodyScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {displayRows.map((row, index) => (
            <View
              key={row.period}
              style={[styles.row, index % 2 === 1 ? styles.zebra : null]}
            >
              <Text style={[styles.cell, styles.periodCell, styles.periodText]}>{row.paymentDate}</Text>
              <Text style={styles.cell}>{fmtMoney(row.payment)}</Text>
              <Text style={styles.cell}>{fmtMoney(row.principal)}</Text>
              <Text style={styles.cell}>{fmtMoney(row.interest)}</Text>
              <Text style={styles.cell}>{fmtMoney(row.balance)}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View>
          {displayRows.map((row, index) => (
            <View
              key={row.period}
              style={[styles.row, index % 2 === 1 ? styles.zebra : null]}
            >
              <Text style={[styles.cell, styles.periodCell, styles.periodText]}>{row.paymentDate}</Text>
              <Text style={styles.cell}>{fmtMoney(row.payment)}</Text>
              <Text style={styles.cell}>{fmtMoney(row.principal)}</Text>
              <Text style={styles.cell}>{fmtMoney(row.interest)}</Text>
              <Text style={styles.cell}>{fmtMoney(row.balance)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 展开 / 收起 */}
      {rows.length > previewCount ? (
        <Pressable
          accessibilityRole="button"
          style={styles.expandBar}
          onPress={() => setExpanded((v) => !v)}
        >
          <Text style={styles.expandText}>{expanded ? '收起' : '查看全部期数'}</Text>
          {expanded ? (
            <ChevronLeftIcon size={14} color={colors.primary} />
          ) : (
            <ChevronRightIcon size={14} color={colors.primary} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    height: 40,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodCell: {
    width: 72,
    flex: 0,
    textAlign: 'left',
    paddingLeft: 6,
  },
  bodyScroll: {
    maxHeight: 430,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  zebra: {
    backgroundColor: '#F8FAFC',
  },
  cell: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text,
    textAlign: 'right',
    paddingRight: 6,
    fontVariant: ['tabular-nums'],
  },
  periodText: {
    color: colors.textSecondary,
    paddingRight: 0,
  },
  expandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
    backgroundColor: '#F7F9FC',
  },
  expandText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.primary,
  },
});
