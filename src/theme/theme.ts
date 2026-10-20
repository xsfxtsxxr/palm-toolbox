/**
 * 掌中工具箱 - 设计规范（主题）
 * 设计基准：375pt 逻辑宽度，浅色 Lavender 灰底 + 深 Teal 主色
 */

export const colors = {
  // 品牌主色（深 Teal，取自设计稿按钮/表头）
  primary: '#0D4A3D',
  primaryDark: '#093027',
  primaryLight: '#E7F2EF',
  primaryPressed: '#0A3B30',

  // 强调色（蓝紫渐变，用于「节省利息」金额）
  accent: '#3E63F2',
  accentPurple: '#8A5CF6',
  accentLight: '#EEF3FF',

  // 背景 / 卡片 / 边框
  background: '#F4F6FA',
  card: '#FFFFFF',
  border: '#EDF0F5',
  divider: '#F0F3F7',
  overlay: 'rgba(15, 23, 42, 0.45)',

  // 文本
  text: '#1F2937',
  textStrong: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#98A2B3',
  textPlaceholder: '#B6BECC',
  white: '#FFFFFF',

  // 功能色
  red: '#FF4D4F',
  redLight: '#FFECEC',
  green: '#22B573',
  greenLight: '#E6F7EF',
  orange: '#F59E2C',

  // 图表
  chartPrincipal: '#3E7BFA',
  chartInterest: '#F5A623',

  // Tab
  tabActive: '#0D4A3D',
  tabInactive: '#A8B3C4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const fontSize = {
  caption: 10,
  mini: 11,
  small: 12,
  body: 13,
  normal: 15,
  title: 16,
  large: 18,
  h1: 22,
  hero: 26,
} as const;

/** 工具图标 Tile 的粉底配色（与设计稿一致） */
export const tileThemes = {
  blue: { bg: '#E3EEFF', color: '#3E7BFA' },
  green: { bg: '#E4F7EC', color: '#35B96E' },
  orange: { bg: '#FFF1E0', color: '#F59E2C' },
  teal: { bg: '#E2F6F2', color: '#17B8A6' },
  purple: { bg: '#F0EBFF', color: '#8B6FF0' },
  coral: { bg: '#FFEDE8', color: '#FB7B4B' },
  indigo: { bg: '#ECEAFB', color: '#6C63F5' },
  red: { bg: '#FFE9E9', color: '#F05252' },
  gold: { bg: '#FFF4DC', color: '#D69A15' },
} as const;

export type TileThemeKey = keyof typeof tileThemes;

/** 常用阴影（卡片浮起） */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
