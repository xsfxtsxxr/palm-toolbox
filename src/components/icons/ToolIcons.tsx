/**
 * 工具箱图标集（SVG 矢量绘制，无图片资源依赖）
 * 统一 24×24 viewBox，线性描边风格，与设计稿一致
 */
import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { ToolIconName } from '../../types';

interface IconProps {
  size?: number;
  color?: string;
}

/* ---------------- 房贷计算器：房子 + 计算器 ---------------- */
const MortgageIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11.2 L12 3.6 L21 11.2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.2 10.4 V19.4 H18.8 V10.4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x={9.3} y={12.6} width={5.4} height={4.6} rx={1} stroke={color} strokeWidth={1.5} />
    <Line x1={10.6} y1={14} x2={13.4} y2={14} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    <Line x1={10.6} y1={15.7} x2={12.6} y2={15.7} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    <Circle cx={16.9} cy={15.4} r={0.85} fill={color} />
  </Svg>
);

/* ---------------- 存款计算器：存钱罐 ---------------- */
const DepositIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx={11} cy={13.4} rx={7.6} ry={6.2} stroke={color} strokeWidth={1.8} />
    <Path d="M4.6 8.6 L3 6.8 L5.6 6.9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={17.4} y={12.2} width={3.4} height={2.6} rx={1.2} stroke={color} strokeWidth={1.5} />
    <Line x1={9.4} y1={8.2} x2={12.8} y2={8.2} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx={7.6} cy={12.2} r={0.7} fill={color} />
    <Line x1={7.4} y1={19.2} x2={7.4} y2={20.8} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1={14.8} y1={19.2} x2={14.8} y2={20.8} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

/* ---------------- 个税计算：税单（¥） ---------------- */
const TaxIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 3.6 H14.2 L18.6 8 V20.4 H6 Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path d="M14 3.8 V7.8 H18.4" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    {/* ¥ 符号 */}
    <Path
      d="M9.8 10.6 L12 13.2 L14.2 10.6 M12 13.2 V16.4 M10.4 12.2 H13.6 M10.4 13.8 H13.6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={8.6} y1={18.2} x2={15.4} y2={18.2} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

/* ---------------- 汇率换算：$ 与双向箭头 ---------------- */
const CurrencyIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5.4 C9.6 5.4 8.4 6.9 8.4 9.1 C8.4 12.4 12 12.9 12 15.4 C12 17.3 10.9 18.6 9.1 18.6 C7.6 18.6 6.5 17.7 6.2 16.2"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
    />
    <Path d="M6.2 13.8 V16.2 H8.8 M6.2 16.2 V18.6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={12} y1={4.4} x2={12} y2={6.6} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Line x1={12} y1={17.4} x2={12} y2={19.6} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M15.6 9.4 L18.2 6.8 M18.2 6.8 H16.2 M18.2 6.8 V8.8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.4 14.6 L5.8 17.2 M5.8 17.2 H7.8 M5.8 17.2 V15.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* ---------------- 单位换算：尺子 ---------------- */
const UnitIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G rotation={-32} origin="12, 12">
      <Rect x={3} y={8.6} width={18} height={6.8} rx={2} stroke={color} strokeWidth={1.8} />
      <Line x1={7} y1={8.6} x2={7} y2={11} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={10} y1={8.6} x2={10} y2={10.4} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={13} y1={8.6} x2={13} y2={11} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Line x1={16} y1={8.6} x2={16} y2={10.4} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </G>
  </Svg>
);

/* ---------------- 记账本：账本 + 笔 ---------------- */
const LedgerIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={4.4} y={3.4} width={12.4} height={15.4} rx={2} stroke={color} strokeWidth={1.8} />
    <Line x1={7.4} y1={8} x2={13.8} y2={8} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    <Line x1={7.4} y1={11} x2={13.8} y2={11} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    <Line x1={7.4} y1={14} x2={11.4} y2={14} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    <Path d="M14.6 17.4 L19.8 12.2 L21.4 13.8 L16.2 19 H14 Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    <Line x1={13.9} y1={18.1} x2={15.9} y2={16.1} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </Svg>
);

/* ---------------- 待办清单：勾选板 ---------------- */
const TodoIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.6} y={3.6} width={16.8} height={16.8} rx={3} stroke={color} strokeWidth={1.8} />
    <Rect x={6.4} y={6.6} width={4} height={4} rx={1.2} stroke={color} strokeWidth={1.4} />
    <Path d="M7.3 8.5 L8.3 9.6 L10 7.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={12.2} y1={8.6} x2={17} y2={8.6} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    <Rect x={6.4} y={12.6} width={4} height={4} rx={1.2} stroke={color} strokeWidth={1.4} />
    <Path d="M7.3 14.5 L8.3 15.6 L10 13.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1={12.2} y1={14.6} x2={16.2} y2={14.6} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </Svg>
);

/* ---------------- 理财计算器：金币 + 上升趋势 ---------------- */
const FinancialIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={9} r={5.8} stroke={color} strokeWidth={1.7} />
    <Path
      d="M7.2 7.1 L9 9.1 L10.8 7.1 M9 9.1 V11.8 M7.7 8.6 H10.3 M7.7 9.9 H10.3"
      stroke={color}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M13.3 19.8 H20.6 V12.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.8 16.3 L16.4 13.7 L18.2 15.5 L21 12.7 M18.7 12.7 H21 V15" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* ---------------- 番茄钟 ---------------- */
const TomatoIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9.4 4.2 C9.4 4.2 9.8 6 12 6 C14.2 6 14.6 4.2 14.6 4.2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M12 6 C12 6 13.2 3.4 15.6 2.8 C15.6 2.8 16.4 4.6 14.8 5.8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={13.6} r={7.4} stroke={color} strokeWidth={1.8} />
    <Path d="M8.2 9.4 C8.2 9.4 9 8.2 10.2 7.8" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    <Circle cx={9.8} cy={12.4} r={0.75} fill={color} />
  </Svg>
);

/* ---------------- 日历提醒 ---------------- */
const CalendarIcon: React.FC<IconProps> = ({ size = 30, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.6} y={5} width={16.8} height={15.4} rx={2.6} stroke={color} strokeWidth={1.8} />
    <Line x1={3.6} y1={9.6} x2={20.4} y2={9.6} stroke={color} strokeWidth={1.8} />
    <Line x1={8.2} y1={2.8} x2={8.2} y2={6.4} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1={15.8} y1={2.8} x2={15.8} y2={6.4} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={8.2} cy={12.8} r={1.05} fill={color} />
    <Circle cx={12} cy={12.8} r={1.05} fill={color} />
    <Circle cx={15.8} cy={12.8} r={1.05} fill={color} />
    <Circle cx={8.2} cy={16.4} r={1.05} fill={color} />
    <Circle cx={12} cy={16.4} r={1.05} fill={color} />
  </Svg>
);

const ICONS: Record<ToolIconName, React.FC<IconProps>> = {
  mortgage: MortgageIcon,
  deposit: DepositIcon,
  tax: TaxIcon,
  currency: CurrencyIcon,
  unit: UnitIcon,
  ledger: LedgerIcon,
  todo: TodoIcon,
  financial: FinancialIcon,
  tomato: TomatoIcon,
  calendar: CalendarIcon,
};

export const ToolIcon: React.FC<IconProps & { name: ToolIconName }> = ({
  name,
  size = 30,
  color,
}) => {
  const Component = ICONS[name];
  return <Component size={size} color={color} />;
};

/** 渐变金额文字（SVG Text 支持渐变填充，用于「节省利息」） */
export const GradientAmountText: React.FC<{
  text: string;
  size?: number;
  width?: number;
}> = ({ text, size = 22, width = 220 }) => (
  <Svg width={width} height={size + 10}>
    <Defs>
      <LinearGradient id="amountGradient" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#3E63F2" />
        <Stop offset="1" stopColor="#8A5CF6" />
      </LinearGradient>
    </Defs>
    <SvgText fill="url(#amountGradient)" fontSize={size} fontWeight="800" x={0} y={size}>
      {text}
    </SvgText>
  </Svg>
);
