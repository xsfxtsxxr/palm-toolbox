/**
 * 应用导航：Stack（MainTabs + 计算器流程）+ BottomTabs（首页/统计/我的）
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/theme';
import { CustomTabBar } from './CustomTabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AllToolsScreen } from '../screens/AllToolsScreen';
import { MortgageCalculatorScreen } from '../screens/MortgageCalculatorScreen';
import { RepaymentPlanScreen } from '../screens/RepaymentPlanScreen';
import { DepositCalculatorScreen } from '../screens/DepositCalculatorScreen';
import { FinancialCalculatorScreen } from '../screens/FinancialCalculatorScreen';
import { TaxCalculatorScreen } from '../screens/TaxCalculatorScreen';
import { TaxDetailScreen } from '../screens/TaxDetailScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Statistics" component={StatisticsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="MortgageCalculator"
        component={MortgageCalculatorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="RepaymentPlan"
        component={RepaymentPlanScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DepositCalculator"
        component={DepositCalculatorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="FinancialCalculator"
        component={FinancialCalculatorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TaxCalculator"
        component={TaxCalculatorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="TaxDetail"
        component={TaxDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AllTools"
        component={AllToolsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);
