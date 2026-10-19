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
    implemented: false,
  },
  {
    id: 'tax',
    name: '个税计算',
    subtitle: '工资到手',
    icon: 'tax',
    tile: 'orange',
    implemented: false,
  },
  {
    id: 'currency',
    name: '汇率换算',
    subtitle: '实时汇率',
    icon: 'currency',
    tile: 'teal',
    implemented: false,
  },
  {
    id: 'unit',
    name: '单位换算',
    subtitle: '长度/重量',
    icon: 'unit',
    tile: 'purple',
    implemented: false,
  },
  {
    id: 'ledger',
    name: '记账本',
    subtitle: '日常开销',
    icon: 'ledger',
    tile: 'coral',
    implemented: false,
  },
  {
    id: 'todo',
    name: '待办清单',
    subtitle: '效率管理',
    icon: 'todo',
    tile: 'indigo',
    implemented: false,
  },
  {
    id: 'tomato',
    name: '番茄钟',
    subtitle: '专注时钟',
    icon: 'tomato',
    tile: 'red',
    implemented: false,
  },
  {
    id: 'calendar',
    name: '日历提醒',
    subtitle: '日程提醒',
    icon: 'calendar',
    tile: 'blue',
    implemented: false,
  },
];

/** 常用贷款年利率预设（基于 LPR 历史值） */
export const RATE_PRESETS = [
  3.0, 3.1, 3.2, 3.3, 3.45, 3.55, 3.65, 3.85, 3.95,
  4.2, 4.3, 4.35, 4.65, 4.9, 5.15, 5.39, 5.88,
];

/** 常用剩余期数预设（月） */
export const PERIOD_PRESETS = [12, 24, 36, 60, 120, 180, 240, 300, 360];
