/** 导航参数类型定义 */
import type { MortgageResult } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  MortgageCalculator: undefined;
  RepaymentPlan: { result: MortgageResult };
  AllTools: undefined;
};

export type TabParamList = {
  Home: undefined;
  Statistics: undefined;
  Profile: undefined;
};
