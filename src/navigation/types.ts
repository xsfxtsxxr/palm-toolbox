/** 导航参数类型定义 */
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MortgageResult } from '../types';
import type { TaxResult } from '../utils/tax';
import type { Todo } from '../utils/todo';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  MortgageCalculator: undefined;
  RepaymentPlan: { result: MortgageResult };
  DepositCalculator: undefined;
  FinancialCalculator: undefined;
  TaxCalculator: undefined;
  TaxDetail: { result: TaxResult };
  CurrencyConverter: undefined;
  UnitConverter: undefined;
  Ledger: undefined;
  GoldPrice: undefined;
  Todo: undefined;
  TodoEdit: { todo?: Todo } | undefined;
  TodoStats: undefined;
  CalcRecords: undefined;
  AllTools: undefined;
};

export type TabParamList = {
  Home: undefined;
  Statistics: undefined;
  Profile: undefined;
};
