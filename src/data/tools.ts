/** 工具清单数据 —— 与设计稿 3×3 网格一一对应 */

import type { Tool } from '../types';

export const TOOLS: Tool[] = [
  {
    id: 'mortgage',
    name: '房贷计算器',
    subtitle: '提前还款测算',
    icon: 'mortgage',
    tile: 'blue',
    implemented: true,
    hot: true,
  },
  {
    id: 'deposit',
    name: '存款计算器',
    subtitle: '利息收益',
    icon: 'deposit',
    tile: 'green',
    implemented: true,
  },
  {
    id: 'financial',
    name: '理财计算器',
    subtitle: '活期理财',
    icon: 'financial',
    tile: 'red',
    implemented: true,
  },
  {
    id: 'tax',
    name: '个税计算',
    subtitle: '工资到手',
    icon: 'tax',
    tile: 'orange',
    implemented: true,
  },
  {
    id: 'currency',
    name: '汇率换算',
    subtitle: '实时汇率',
    icon: 'currency',
    tile: 'teal',
    implemented: true,
  },
  {
    id: 'unit',
    name: '单位换算',
    subtitle: '长度/重量',
    icon: 'unit',
    tile: 'purple',
    implemented: true,
  },
  {
    id: 'ledger',
    name: '记账本',
    subtitle: '日常开销',
    icon: 'ledger',
    tile: 'coral',
    implemented: true,
  },
  {
    id: 'todo',
    name: '待办清单',
    subtitle: '效率管理',
    icon: 'todo',
    tile: 'indigo',
    implemented: true,
  },
  {
    id: 'gold',
    name: '金价查询',
    subtitle: '品牌挂牌价',
    icon: 'gold',
    tile: 'gold',
    implemented: true,
  },
];

/** 常用贷款年利率预设（基于 LPR 历史值） */
export const RATE_PRESETS = [
  3.0, 3.1, 3.2, 3.3, 3.45, 3.55, 3.65, 3.85, 3.95,
  4.2, 4.3, 4.35, 4.65, 4.9, 5.15, 5.39, 5.88,
];

/** 常用剩余期数预设（月） */
export const PERIOD_PRESETS = [12, 24, 36, 60, 120, 180, 240, 300, 360];

/**
 * 常见人民币定期存款挂牌利率（%），仅作参考
 * 各家银行、各期限、各起存金额的实际利率可能不同，以柜面/手机银行为准
 */
export const DEPOSIT_RATE_PRESETS: { label: string; rate: number }[] = [
  { label: '三个月', rate: 0.65 },
  { label: '六个月', rate: 0.85 },
  { label: '一年期', rate: 0.95 },
  { label: '二年期', rate: 1.05 },
  { label: '三年期', rate: 1.25 },
  { label: '五年期', rate: 1.30 },
  { label: '特色存款', rate: 1.55 },
  { label: '大额存单', rate: 1.75 },
];

/** 活期理财常用七日年化收益率（%） */
export const WEALTH_ANNUAL_PRESETS = [1.5, 1.8, 2.0, 2.2, 2.5, 2.8, 3.0, 3.3, 3.5];

/** 活期理财常用每万份收益（元） */
export const WEALTH_WANFEN_PRESETS = [0.5, 0.65, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0];

/** 持有天数预设 */
export const WEALTH_DAY_PRESETS = [7, 14, 30, 60, 90, 180, 270, 365, 540, 730];
