/**
 * 通用 UI 图标（SVG 线性风格，与工具图标统一）
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/** 返回箭头 */
export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#1F2937' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 4.5 L7.5 12 L15 19.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 信息说明 */
export const InfoIcon: React.FC<IconProps> = ({ size = 22, color = '#1F2937' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
    <Line x1={12} y1={10.8} x2={12} y2={16.6} stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    <Circle cx={12} cy={7.6} r={1.05} fill={color} />
  </Svg>
);

/** 右箭头（更多/展开） */
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, color = '#98A2B3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5 L15.5 12 L9 19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 左箭头（收起） */
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 16, color = '#98A2B3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 5 L8.5 12 L15 19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 日历（输入框行内） */
export const CalendarIcon: React.FC<IconProps> = ({ size = 18, color = '#0D4A3D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.4} y={5.2} width={17.2} height={15.6} rx={2.6} stroke={color} strokeWidth={1.7} />
    <Line x1={3.4} y1={10} x2={20.6} y2={10} stroke={color} strokeWidth={1.7} />
    <Line x1={8.2} y1={3} x2={8.2} y2={6.6} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Line x1={15.8} y1={3} x2={15.8} y2={6.6} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Circle cx={8.2} cy={13.4} r={0.9} fill={color} />
    <Circle cx={12} cy={13.4} r={0.9} fill={color} />
    <Circle cx={15.8} cy={13.4} r={0.9} fill={color} />
  </Svg>
);

/** 盾牌勾（提前还款保障） */
export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 26, color = '#3E7BFA' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.8 L20 5.6 V11.4 C20 16.6 16.6 20.4 12 21.6 C7.4 20.4 4 16.6 4 11.4 V5.6 Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path
      d="M8.6 11.8 L10.9 14.1 L15.6 9.2"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 导出（上传箭头） */
export const ExportIcon: React.FC<IconProps> = ({ size = 14, color = '#0D4A3D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15.4 V4.2 M12 4.2 L7.8 8.4 M12 4.2 L16.2 8.4"
      stroke={color}
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M4.6 14.4 V19.2 C4.6 20.2 5.4 21 6.4 21 H17.6 C18.6 21 19.4 20.2 19.4 19.2 V14.4" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
  </Svg>
);

/** 关闭 */
export const CloseIcon: React.FC<IconProps> = ({ size = 18, color = '#98A2B3' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

/** 相机小徽标（头像编辑） */
export const CameraBadgeIcon: React.FC<IconProps> = ({ size = 10, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8.4 C4 7.6 4.6 7 5.4 7 H8.2 L9.8 4.6 H14.2 L15.8 7 H18.6 C19.4 7 20 7.6 20 8.4 V17.6 C20 18.4 19.4 19 18.6 19 H5.4 C4.6 19 4 18.4 4 17.6 Z"
      stroke={color}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={2.2} />
  </Svg>
);

/* ---------------- 底部 Tab 图标 ---------------- */

export const HomeTabIcon: React.FC<IconProps & { active?: boolean }> = ({
  size = 24,
  color = '#A8B3C4',
  active = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.4 10.8 L12 3.4 L20.6 10.8"
      stroke={color}
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.6 9.8 V19.6 C5.6 20.3 6.2 20.9 6.9 20.9 H17.1 C17.8 20.9 18.4 20.3 18.4 19.6 V9.8"
      stroke={color}
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? color : 'none'}
      fillOpacity={active ? 0.12 : 0}
    />
  </Svg>
);

export const ChartTabIcon: React.FC<IconProps & { active?: boolean }> = ({
  size = 24,
  color = '#A8B3C4',
  active = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.4} y={3.4} width={17.2} height={17.2} rx={3} stroke={color} strokeWidth={active ? 2.2 : 1.8} />
    <Line x1={7.4} y1={16} x2={7.4} y2={11.4} stroke={color} strokeWidth={active ? 2.4 : 2} strokeLinecap="round" />
    <Line x1={12} y1={16} x2={12} y2={7.4} stroke={color} strokeWidth={active ? 2.4 : 2} strokeLinecap="round" />
    <Line x1={16.6} y1={16} x2={16.6} y2={13.4} stroke={color} strokeWidth={active ? 2.4 : 2} strokeLinecap="round" />
  </Svg>
);

export const PersonTabIcon: React.FC<IconProps & { active?: boolean }> = ({
  size = 24,
  color = '#A8B3C4',
  active = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8.2} r={4.1} stroke={color} strokeWidth={active ? 2.2 : 1.8} fill={active ? color : 'none'} fillOpacity={active ? 0.12 : 0} />
    <Path
      d="M4.4 20.4 C4.4 16.6 7.8 14 12 14 C16.2 14 19.6 16.6 19.6 20.4"
      stroke={color}
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
    />
  </Svg>
);

/** 头像占位（人形） */
export const AvatarPersonIcon: React.FC<IconProps> = ({ size = 28, color = '#3E7BFA' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8.6} r={3.9} stroke={color} strokeWidth={1.8} />
    <Path d="M4.8 20.2 C4.8 16.7 8 14.4 12 14.4 C16 14.4 19.2 16.7 19.2 20.2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

/** 统计空态图标 */
export const ChartEmptyIcon: React.FC<IconProps> = ({ size = 56, color = '#C3CDDD' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.2} y={3.2} width={17.6} height={17.6} rx={3.4} stroke={color} strokeWidth={1.6} />
    <Line x1={7.6} y1={15.8} x2={7.6} y2={11.6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1={12} y1={15.8} x2={12} y2={7.8} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1={16.4} y1={15.8} x2={16.4} y2={13.2} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
