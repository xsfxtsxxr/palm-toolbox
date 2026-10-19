/**
 * 自定义底部 Tab Bar（与设计稿一致：图标 + 文字，激活态深 Teal）
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, shadow } from '../theme/theme';
import { ChartTabIcon, HomeTabIcon, PersonTabIcon } from '../components/icons/UIIcons';

const TAB_CONFIG: Record<string, { label: string; Icon: typeof HomeTabIcon }> = {
  Home: { label: '首页', Icon: HomeTabIcon },
  Statistics: { label: '统计', Icon: ChartTabIcon },
  Profile: { label: '我的', Icon: PersonTabIcon },
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;
        const focused = state.index === index;
        const color = focused ? colors.tabActive : colors.tabInactive;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={styles.tab}
            onPress={onPress}
          >
            <config.Icon size={24} color={color} active={focused} />
            <Text style={[styles.label, { color }]}>{config.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    ...shadow.tabBar,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
});
