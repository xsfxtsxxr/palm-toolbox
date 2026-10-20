/** 导航参数类型定义 */
import type { MortgageResult } from '../types';
import type { TaxResult } from '../utils/tax';

export type RootStackParamList = {
  MainTabs: undefined;
  MortgageCalculator: undefined;
  RepaymentPlan: { result: MortgageResult };
  DepositCalculator: undefined;
  FinancialCalculator: undefined;
  TaxCalculator: undefined;
  TaxDetail: { result: TaxResult };
  AllTools: undefined;
};

export type TabParamList = {
  Home: undefined;
  Statistics: undefined;
  Profile: undefined;
};
