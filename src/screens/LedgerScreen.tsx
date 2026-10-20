/**
 * 记账本：记一笔 / 流水明细 / 月度统计（单页三视图，底部 Tab 切换）
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, shadow, spacing } from '../theme/theme';
import {
  applyDraft,
  categoryOf,
  createRecord,
  currentMonthKey,
  formatDateCN,
  monthKeyOf,
  recentAmounts,
  recordsToCSV,
  sortRecords,
  type LedgerDraft,
  type LedgerRecord,
} from '../utils/ledger';
import { readLedgerRecords, writeLedgerRecords } from '../utils/ledgerStorage';
import { fmtDecimal } from '../utils/format';
import { LedgerEntryForm } from '../components/LedgerEntryForm';
import { LedgerListView } from '../components/LedgerListView';
import { LedgerStatsView } from '../components/LedgerStatsView';
import { InfoModal } from '../components/InfoModal';
import { useToast } from '../components/Toast';
import {
  BackIcon,
  ChartTabIcon,
  InfoIcon,
  ListIcon,
  PlusCircleIcon,
} from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'entry' | 'list' | 'stats';

const TABS: { key: TabKey; label: string; title: string; subtitle: string }[] = [
  { key: 'entry', label: '记一笔', title: '记一笔', subtitle: '支出收入随手记，3 秒记完一笔' },
  { key: 'list', label: '明细', title: '流水明细', subtitle: '按日分组，左滑可编辑或删除' },
  { key: 'stats', label: '统计', title: '月度统计', subtitle: '结余、分类占比与近 6 个月趋势' },
];

const HELP_TEXT =
  '这是本地记账本，所有记录只保存在这台设备上，不会上传服务器。\n\n' +
  '· 记一笔：切换支出 / 收入，填金额、选分类、改日期，可加备注；金额上限 999,999.99。\n' +
  '· 最近金额：自动带出最近 3 笔不重复的金额，点一下即可填入。\n' +
  '· 明细：默认显示当月，按日期分组并给出每天小计；单条记录左滑露出「编辑 / 删除」。\n' +
  '· 统计：本月结余、支出 / 收入分类占比、近 6 个月收支趋势（点柱子可切月）。\n' +
  '· 导出：把当月流水导出为 CSV 文本，可通过系统分享发送到备忘录、邮箱或文件 App。\n\n' +
  '卸载应用或清除应用数据会一并删除记录，重要数据请定期导出。';

export const LedgerScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [tab, setTab] = useState<TabKey>('entry');
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LedgerRecord | null>(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const loaded = await readLedgerRecords();
      if (!alive) return;
      setRecords(sortRecords(loaded));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: LedgerRecord[]) => {
    const sorted = sortRecords(next);
    setRecords(sorted);
    void writeLedgerRecords(sorted);
  }, []);

  const recent = useMemo(() => recentAmounts(records, 3), [records]);
  const currentTab = TABS.find((item) => item.key === tab) ?? TABS[0];

  const handleSave = (draft: LedgerDraft) => {
    // 记录所在月份，保存后让明细 / 统计跟随到该月
    setMonth(monthKeyOf(draft.date));

    if (editing) {
      persist(records.map((record) => (record.id === editing.id ? applyDraft(record, draft) : record)));
      setEditing(null);
      showToast('已保存修改');
      return;
    }

    persist([createRecord(draft), ...records]);
    const label = draft.type === 'expense' ? '支出' : '收入';
    showToast(`已记录${label} ¥${fmtDecimal(draft.amount, 2)}`);
  };

  const handleDelete = (record: LedgerRecord) => {
    const category = categoryOf(record.type, record.category);
    Alert.alert(
      '删除这条记录？',
      `${formatDateCN(record.date)} ${category.name} ${record.type === 'expense' ? '-' : '+'}¥${fmtDecimal(
        record.amount,
        2,
      )}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            persist(records.filter((item) => item.id !== record.id));
            if (editing?.id === record.id) setEditing(null);
            showToast('已删除');
          },
        },
      ],
    );
  };

  const handleEdit = (record: LedgerRecord) => {
    Keyboard.dismiss();
    setEditing(record);
    setTab('entry');
  };

  const handleExport = async (list: LedgerRecord[], exportMonth: string) => {
    const csv = recordsToCSV(list);
    try {
      await Share.share({
        title: `记账本-${exportMonth}.csv`,
        message: csv,
      });
    } catch {
      showToast('导出失败，请重试');
    }
  };

  const switchTab = (next: TabKey) => {
    if (next === tab) return;
    Keyboard.dismiss();
    setTab(next);
  };

  return (
    <LinearGradient colors={['#F7F9F8', '#EEF2F1']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => navigation.goBack()}>
          <BackIcon size={22} color={colors.textStrong} />
        </Pressable>
        <Text style={styles.headerTitle}>记账本</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setInfoVisible(true)}>
          <InfoIcon size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{currentTab.title}</Text>
        <Text style={styles.heroSubtitle}>{currentTab.subtitle}</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>正在读取本地记录…</Text>
          </View>
        ) : tab === 'entry' ? (
          <LedgerEntryForm
            key={editing?.id ?? 'ledger-new'}
            editing={editing}
            recent={recent}
            onSave={handleSave}
            onCancelEdit={() => setEditing(null)}
          />
        ) : tab === 'list' ? (
          <LedgerListView
            records={records}
            month={month}
            onChangeMonth={setMonth}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={() => switchTab('entry')}
            onExport={(list, exportMonth) => void handleExport(list, exportMonth)}
          />
        ) : (
          <LedgerStatsView records={records} month={month} onChangeMonth={setMonth} />
        )}
      </View>

      {/* 底部 Tab */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + spacing.xs }]}>
        {TABS.map((item) => {
          const active = item.key === tab;
          const color = active ? colors.primary : colors.tabInactive;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={styles.tabItem}
              onPress={() => switchTab(item.key)}
            >
              {item.key === 'entry' ? (
                <PlusCircleIcon size={22} color={color} />
              ) : item.key === 'list' ? (
                <ListIcon size={22} color={color} />
              ) : (
                <ChartTabIcon size={22} color={color} active={active} />
              )}
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              {item.key === 'list' && records.length > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {records.length > 99 ? '99+' : records.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <InfoModal
        visible={infoVisible}
        title="记账本说明"
        content={HELP_TEXT}
        onClose={() => setInfoVisible(false)}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
    marginTop: spacing.sm,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.small,
    color: colors.textTertiary,
  },

  /* 底部 Tab */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    ...shadow.tabBar,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    marginTop: 3,
    fontSize: fontSize.caption,
    color: colors.tabInactive,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: '30%',
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FB7B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
});
