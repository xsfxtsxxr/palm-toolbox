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

  // 语义色（页面渐变 / 结果卡渐变 / 输入底色）
  screenFrom: '#F7F9F8',
  screenTo: '#EEF2F1',
  mintFrom: '#E7F7F1',
  mintTo: '#F2FBF7',
  inputBg: '#F2F4F8',
  chipBg: '#F3F5F5',
  /** 结果卡 / 提示条的描边 */
  mintBorder: '#CDE9DE',
  /** 成功 / 提示文案（浅色为深绿，深色为浅绿） */
  onMint: '#2C5748',
} as const;

/** 调色板类型：深色与浅色必须保持完全一致的键 */
export type Palette = { [K in keyof typeof colors]: string };

/** 深色模式调色板（深墨绿底 + 提亮的薄荷绿主色） */
export const darkColors: Palette = {
  primary: '#2E9B7C',
  primaryDark: '#1D7A60',
  primaryLight: '#12302A',
  primaryPressed: '#37AC8B',

  accent: '#7FA0FF',
  accentPurple: '#B49BFF',
  accentLight: '#1A2440',

  background: '#0B1210',
  card: '#141E1B',
  border: '#23302C',
  divider: '#1D2926',
  overlay: 'rgba(0, 0, 0, 0.62)',

  text: '#DCE7E3',
  textStrong: '#F0F6F4',
  textSecondary: '#9DB0A9',
  textTertiary: '#788B85',
  textPlaceholder: '#5E706B',
  white: '#FFFFFF',

  red: '#FF6B6D',
  redLight: '#3A2020',
  green: '#3FD08C',
  greenLight: '#143023',
  orange: '#FFB547',

  chartPrincipal: '#7FA0FF',
  chartInterest: '#FFC15E',

  tabActive: '#4FC49F',
  tabInactive: '#6E807B',

  screenFrom: '#0E1513',
  screenTo: '#090F0D',
  mintFrom: '#123029',
  mintTo: '#0E241E',
  inputBg: '#18231F',
  chipBg: '#1A2522',
  mintBorder: '#245044',
  onMint: '#A9D6C7',
};

/**
 * 历史遗留的硬编码浅色值 → 深色对应值的映射表。
 * 早期页面在局部手写了背景 / 描边 / 文案色，深色模式下由 useThemedStyles 统一改写，
 * 避免逐个文件改动样式表。注意：不要映射 #FFFFFF，它是按钮上的白字。
 */
export const DARK_REMAP: Record<string, string> = {
  // 页面 / 输入底色
  '#F4F6FA': '#0B1210',
  '#F7F9F8': '#0E1513',
  '#EEF2F1': '#0A100E',
  '#F7F9FD': '#0E1513',
  '#EFF3F9': '#0A100E',
  '#F2F4F8': '#15201D',
  '#F3F5F5': '#15201D',
  '#F3F6F5': '#15201D',
  '#F2F6F5': '#15201D',
  '#F0F3F2': '#15201D',
  '#F7FAF9': '#15201D',
  '#FBFCFC': '#15201D',
  '#F8FAFC': '#15201D',
  '#F7F9FC': '#15201D',
  '#F6FAFF': '#15201D',

  // 描边 / 分隔线 / 关闭态轨道
  '#E9EDF3': '#23302C',
  '#EDF0F5': '#23302C',
  '#F0F3F7': '#23302C',
  '#E6EBEA': '#23302C',
  '#E6EDEA': '#23302C',
  '#E4E9E7': '#23302C',
  '#D8DEE7': '#2C3A36',
  '#C3CDDD': '#4C5C57',
  '#C3D2CC': '#394A45',

  // 文本 / 图标
  '#1F2937': '#DCE7E3',
  '#111827': '#F0F6F4',
  '#2C3A36': '#E3EDE9',
  '#3B4744': '#C4D2CD',
  '#6B7280': '#9DB0A9',
  '#98A2B3': '#83958F',
  '#A8B3C4': '#7E9089',
  '#B6BECC': '#5E706B',
  '#9AA9C4': '#5E706B',
  '#B9C6D2': '#5E706B',
  '#5B6B85': '#93A5A0',

  // 薄荷绿家族
  '#EAF4F0': '#16302A',
  '#E7F2EF': '#16302A',
  '#E9EFEC': '#16302A',
  '#E7F7F1': '#14342A',
  '#F2FBF7': '#102A22',
  '#DCEFE8': '#1B3A31',
  '#DCEAE4': '#1B3A31',
  '#D6E6E0': '#1B3A31',
  '#CDE9DE': '#245044',
  '#BFDCD1': '#2C4C42',
  '#BEDCCF': '#2C4C42',
  '#A8CFC1': '#35705F',
  '#A6D8C6': '#3E8672',
  '#9CC9B9': '#4E9E86',
  '#8FC7B6': '#4E9E86',
  '#9FB8AF': '#6F8C84',
  '#6D9C8D': '#7FB5A4',
  '#5F8A7C': '#7FB5A4',
  '#4F7C6D': '#8FC4B2',
  '#3F6B5E': '#8FC4B2',
  '#2C5748': '#A9D6C7',
  '#12604F': '#0F4C3E',
  '#0B3F35': '#0A3630',

  // 蓝 / 紫
  '#E3EEFF': '#16273D',
  '#EEF3FF': '#16273D',
  '#ECEAFB': '#232038',
  '#F0EBFF': '#231D36',
  '#E2F6F2': '#12302B',
  '#E4F7EC': '#143023',
  '#E6F7EF': '#143023',
  '#3E7BFA': '#6EA0FF',
  '#3E63F2': '#7B96FF',
  '#8A5CF6': '#A98BFF',
  '#8B6FF0': '#A98BFF',
  '#6C63F5': '#8F88FF',

  // 警示 / 暖色
  '#FFECEC': '#3A2020',
  '#FFE9E9': '#33201A',
  '#FFEDE8': '#33201A',
  '#FFF8F1': '#2E2317',
  '#FFF5E6': '#2E2317',
  '#FFF4E3': '#2E2317',
  '#FFF4DC': '#3A2E12',
  '#FFF1E0': '#3A2A12',
  '#FBDCBC': '#5A4326',
  '#B7791F': '#E0A64B',
  '#B47C09': '#E0A64B',
  '#8A5A16': '#E0A64B',
  '#B26A1F': '#E0A64B',
  '#D69A15': '#F0C05A',
  '#F5A623': '#F5B84D',
  '#F59E2C': '#F5A83C',
  '#FF4D4F': '#FF6B6D',
  '#F05252': '#FF6B6D',
  '#FB7B4B': '#FF9268',
  '#35B96E': '#3FD08C',
  '#22B573': '#3FD08C',
  '#17B8A6': '#3FD0BC',

  // 阴影
  '#0F172A': '#000000',
};

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

export type TileTheme = { bg: string; color: string };

/** 深色模式下的图标 Tile 配色（低饱和底 + 提亮前景） */
export const tileThemesDark: Record<TileThemeKey, TileTheme> = {
  blue: { bg: '#16273D', color: '#6EA0FF' },
  green: { bg: '#143023', color: '#3FD08C' },
  orange: { bg: '#3A2A12', color: '#FFB547' },
  teal: { bg: '#12302B', color: '#3FD0BC' },
  purple: { bg: '#231D36', color: '#A98BFF' },
  coral: { bg: '#33201A', color: '#FF9268' },
  indigo: { bg: '#232038', color: '#8F88FF' },
  red: { bg: '#3A2020', color: '#FF6B6D' },
  gold: { bg: '#3A2E12', color: '#F0C05A' },
};

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
