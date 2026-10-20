/** 单位换算引擎单元测试 */
import {
  QUICK_PAIRS,
  UNITS,
  convertUnit,
  findUnit,
  fmtUnitValue,
  unitRate,
  type UnitCategory,
} from './unit';

describe('长度换算', () => {
  it('厘米与英寸 / 英尺 / 码 / 尺', () => {
    expect(convertUnit(1, 'length', 'cm', 'in')).toBeCloseTo(0.3937007874, 8);
    expect(convertUnit(1, 'length', 'in', 'cm')).toBe(2.54);
    expect(convertUnit(1, 'length', 'cm', 'ft')).toBeCloseTo(0.032808399, 8);
    expect(convertUnit(1, 'length', 'ft', 'cm')).toBe(30.48);
    expect(convertUnit(1, 'length', 'cm', 'yd')).toBeCloseTo(0.010936133, 8);
    expect(convertUnit(1, 'length', 'yd', 'cm')).toBe(91.44);
    expect(convertUnit(1, 'length', 'cm', 'chi')).toBeCloseTo(0.03, 10);
    expect(convertUnit(1, 'length', 'chi', 'cm')).toBeCloseTo(100 / 3, 10);
  });

  it('海里与千米、英里与千米', () => {
    expect(convertUnit(1, 'length', 'nmi', 'km')).toBeCloseTo(1.852, 10);
    expect(convertUnit(1, 'length', 'km', 'nmi')).toBeCloseTo(1 / 1.852, 10);
    expect(convertUnit(1, 'length', 'mi', 'km')).toBeCloseTo(1.609344, 10);
    expect(convertUnit(10, 'length', 'mi', 'km')).toBeCloseTo(16.09344, 8);
  });
});

describe('重量换算', () => {
  it('盎司 / 磅 / 克拉 / 斤 与克', () => {
    expect(convertUnit(1, 'weight', 'oz', 'g')).toBeCloseTo(28.349523125, 6);
    expect(convertUnit(1, 'weight', 'lb', 'g')).toBeCloseTo(453.59237, 6);
    expect(convertUnit(1, 'weight', 'ct', 'g')).toBeCloseTo(0.2, 10);
    expect(convertUnit(1, 'weight', 'jin', 'g')).toBeCloseTo(500, 10);
    expect(convertUnit(2, 'weight', 'jin', 'g')).toBe(1000);
  });

  it('克转盎司 / 磅', () => {
    expect(convertUnit(100, 'weight', 'g', 'oz')).toBeCloseTo(3.527396195, 6);
    expect(convertUnit(500, 'weight', 'g', 'lb')).toBeCloseTo(1.102311311, 6);
  });
});

describe('通用行为', () => {
  it('同单位换算返回原值', () => {
    expect(convertUnit(12.34, 'length', 'cm', 'cm')).toBe(12.34);
    expect(convertUnit(12.34, 'weight', 'g', 'g')).toBe(12.34);
  });

  it('零值与非法单位返回 0', () => {
    expect(convertUnit(0, 'length', 'cm', 'in')).toBe(0);
    expect(convertUnit(1, 'length', 'cm', 'unknown')).toBe(0);
    expect(convertUnit(Number.NaN, 'weight', 'g', 'oz')).toBe(0);
  });

  it('往返换算误差可忽略', () => {
    const pairs: [UnitCategory, string, string][] = [
      ['length', 'cm', 'in'],
      ['length', 'nmi', 'km'],
      ['length', 'mi', 'chi'],
      ['weight', 'oz', 'jin'],
      ['weight', 'ct', 'lb'],
    ];
    pairs.forEach(([category, from, to]) => {
      const value = 123.45;
      const roundTrip = convertUnit(convertUnit(value, category, from, to), category, to, from);
      expect(roundTrip).toBeCloseTo(value, 8);
    });
  });

  it('单位系数：1 单位的目标值', () => {
    expect(unitRate('length', 'cm', 'in')).toBeCloseTo(0.3937007874, 8);
    expect(unitRate('weight', 'jin', 'g')).toBe(500);
  });
});

describe('常用换算组合', () => {
  it('覆盖需求中的 10 组换算', () => {
    expect(QUICK_PAIRS.length).toHaveLength(6);
    expect(QUICK_PAIRS.weight).toHaveLength(4);

    const labels = [...QUICK_PAIRS.length, ...QUICK_PAIRS.weight].map((pair) => pair.label);
    expect(labels).toEqual([
      '厘米和英寸',
      '厘米和尺',
      '厘米和码',
      '厘米和英尺',
      '海里和千米',
      '英里和千米',
      '盎司和克',
      '磅和克',
      '克拉和克',
      '斤和克',
    ]);
  });

  it('组合中的单位都存在于对应分类', () => {
    (['length', 'weight'] as UnitCategory[]).forEach((category) => {
      QUICK_PAIRS[category].forEach((pair) => {
        expect(findUnit(category, pair.from)).toBeDefined();
        expect(findUnit(category, pair.to)).toBeDefined();
        expect(pair.from).not.toBe(pair.to);
      });
      const codes = UNITS[category].map((unit) => unit.code);
      expect(new Set(codes).size).toBe(codes.length);
    });
  });
});

describe('fmtUnitValue 结果格式化', () => {
  it('按量级保留小数并去掉末尾 0', () => {
    expect(fmtUnitValue(0.3937007874)).toBe('0.393701');
    expect(fmtUnitValue(2.54)).toBe('2.54');
    expect(fmtUnitValue(1852)).toBe('1,852');
    expect(fmtUnitValue(0.2)).toBe('0.2');
    expect(fmtUnitValue(500)).toBe('500');
    expect(fmtUnitValue(1609.344)).toBe('1,609.34');
    expect(fmtUnitValue(0)).toBe('0');
    expect(fmtUnitValue(Number.POSITIVE_INFINITY)).toBe('--');
  });
});
