/**
 * 首页：问候头部 + 我的工具箱（3×3 网格）
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, shadow, spacing } from '../theme/theme';
import { TOOLS } from '../data/tools';
import type { Tool } from '../types';
import { ToolCard } from '../components/ToolCard';
import { useToast } from '../components/Toast';
import { AvatarPersonIcon, CameraBadgeIcon, ChevronRightIcon } from '../components/icons/UIIcons';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const handleToolPress = (tool: Tool) => {
    if (tool.id === 'mortgage') {
      navigation.navigate('MortgageCalculator');
    } else if (tool.id === 'deposit') {
      navigation.navigate('DepositCalculator');
    } else if (tool.id === 'financial') {
      navigation.navigate('FinancialCalculator');
    } else if (tool.id === 'tax') {
      navigation.navigate('TaxCalculator');
    } else if (tool.id === 'currency') {
      navigation.navigate('CurrencyConverter');
    } else if (tool.id === 'unit') {
      navigation.navigate('UnitConverter');
    } else if (tool.id === 'ledger') {
      navigation.navigate('Ledger');
    } else if (tool.id === 'todo') {
      navigation.navigate('Todo');
    } else if (tool.id === 'gold') {
      navigation.navigate('GoldPrice');
    } else {
      showToast(`「${tool.name}」即将上线，敬请期待`);
    }
  };

  // 按 3 列切分行
  const rows: Tool[][] = [];
  for (let i = 0; i < TOOLS.length; i += 3) {
    rows.push(TOOLS.slice(i, i + 3));
  }

  return (
    <LinearGradient colors={['#F7F9FD', '#EFF3F9']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 问候头部 */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>你好，小明</Text>
            <Text style={styles.subGreeting}>今天也想高效一点</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.avatar} onPress={() => showToast('头像上传功能开发中')}>
            <AvatarPersonIcon size={26} color="#3E7BFA" />
            <View style={styles.avatarBadge}>
              <CameraBadgeIcon size={10} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* 我的工具箱 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>我的工具箱</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.allLink}
            onPress={() => navigation.navigate('AllTools')}
          >
            <Text style={styles.allLinkText}>全部</Text>
            <ChevronRightIcon size={14} color={colors.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onPress={handleToolPress} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerTextWrap: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.textStrong,
    letterSpacing: 0.5,
  },
  subGreeting: {
    marginTop: 4,
    fontSize: fontSize.body,
    color: colors.textTertiary,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3E7BFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F9FD',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.textStrong,
  },
  allLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  allLinkText: {
    fontSize: fontSize.body,
    color: colors.textTertiary,
  },
  grid: {
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
