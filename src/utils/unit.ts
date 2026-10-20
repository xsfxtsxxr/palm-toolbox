/**
 * 单位换算引擎（长度 / 重量）
 *
 * 统一先换算到基准单位，再换算到目标单位：
 *   长度基准：厘米（cm）
 *   重量基准：克（g）
 *
 * 换算系数均为精确定义值：
 *   1 英寸 = 2.54 cm，1 英尺 = 30.48 cm，1 码 = 91.44 cm
 *   1 尺（市尺）= 1/3 m，1 海里 = 1.852 km，1 英里 = 1.609344 km
 *   1 盎司 = 28.349523125 g，1 磅 = 453.59237 g，1 克拉 = 0.2 g，1 斤 = 500 g
 */

export type UnitCategory = 'length' | 'weight';

export interface UnitDef {
  /** 内部唯一标识 */
  code: string;
  /** 中文名称 */
  name: string;
  /** 展示用符号 */
  symbol: string;
  /** 换算到基准单位的系数 */
  factor: number;
}

/** 长度单位（基准：厘米） */
export const LENGTH_UNITS: UnitDef[] = [
  { code: 'cm', name: '厘米', symbol: 'cm', factor: 1 },
  { code: 'in', name: '英寸', symbol: 'in', factor: 2.54 },
  { code: 'ft', name: '英尺', symbol: 'ft', factor: 30.48 },
  { code: 'yd', name: '码', symbol: 'yd', factor: 91.44 },
  { code: 'chi', name: '尺（市尺）', symbol: '尺', factor: 100 / 3 },
  { code: 'km', name: '千米', symbol: 'km', factor: 100_000 },
  { code: 'nmi', name: '海里', symbol: 'nmi', factor: 185_200 },
  { code: 'mi', name: '英里', symbol: 'mi', factor: 160_934.4 },
];

/** 重量单位（基准：克） */
export const WEIGHT_UNITS: UnitDef[] = [
  { code: 'g', name: '克', symbol: 'g', factor: 1 },
  { code: 'oz', name: '盎司', symbol: 'oz', factor: 28.349523125 },
  { code: 'lb', name: '磅', symbol: 'lb', factor: 453.59237 },
  { code: 'ct', name: '克拉', symbol: 'ct', factor: 0.2 },
  { code: 'jin', name: '斤（市斤）', symbol: '斤', factor: 500 },
];

export const UNITS: Record<UnitCategory, UnitDef[]> = {
  length: LENGTH_UNITS,
  weight: WEIGHT_UNITS,
};

export interface QuickPair {
  from: string;
  to: string;
  /** 行标题，如「厘米和英寸」 */
  label: string;
  /** 左侧短标签 */
  tag: string;
}

/** 常用换算组合（与需求 / 原型一致） */
export const QUICK_PAIRS: Record<UnitCategory, QuickPair[]> = {
  length: [
    { from: 'cm', to: 'in', label: '厘米和英寸', tag: 'cm' },
    { from: 'cm', to: 'chi', label: '厘米和尺', tag: '尺' },
    { from: 'cm', to: 'yd', label: '厘米和码', tag: '码' },
    { from: 'cm', to: 'ft', label: '厘米和英尺', tag: 'ft' },
    { from: 'nmi', to: 'km', label: '海里和千米', tag: '海里' },
    { from: 'mi', to: 'km', label: '英里和千米', tag: '英里' },
  ],
  weight: [
    { from: 'oz', to: 'g', label: '盎司和克', tag: 'oz' },
    { from: 'lb', to: 'g', label: '磅和克', tag: 'lb' },
    { from: 'ct', to: 'g', label: '克拉和克', tag: 'ct' },
    { from: 'jin', to: 'g', label: '斤和克', tag: '斤' },
  ],
};

export const CATEGORY_META: Record<
  UnitCategory,
  { label: string; defaultFrom: string; defaultTo: string }
> = {
  length: { label: '长度', defaultFrom: 'cm', defaultTo: 'in' },
  weight: { label: '重量', defaultFrom: 'oz', defaultTo: 'g' },
};

const UNIT_MAP: Record<UnitCategory, Record<string, UnitDef>> = {
  length: LENGTH_UNITS.reduce((map, unit) => ({ ...map, [unit.code]: unit }), {}),
  weight: WEIGHT_UNITS.reduce((map, unit) => ({ ...map, [unit.code]: unit }), {}),
};

export function findUnit(category: UnitCategory, code: string): UnitDef | undefined {
  return UNIT_MAP[category][code];
}

/** 单位换算：value 单位 from → 单位 to */
export function convertUnit(
  value: number,
  category: UnitCategory,
  from: string,
  to: string,
): number {
  const fromUnit = findUnit(category, from);
  const toUnit = findUnit(category, to);
  if (!fromUnit || !toUnit || !Number.isFinite(value)) return 0;
  return (value * fromUnit.factor) / toUnit.factor;
}

/** 单位汇率：1 单位 from = ? 单位 to */
export function unitRate(category: UnitCategory, from: string, to: string): number {
  return convertUnit(1, category, from, to);
}

/**
 * 换算结果格式化：≥1000 保留 2 位，≥1 保留 4 位，<1 保留 6 位，并去掉末尾 0
 * 如 0.3937007874 -> "0.393701"，2.54 -> "2.54"，1852 -> "1,852"
 */
export function fmtUnitValue(value: number): string {
  if (!Number.isFinite(value)) return '--';

  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  let text = value.toFixed(digits);
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');

  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [intPart, decPart] = unsigned.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}${decPart ? `.${decPart}` : ''}`;
}
