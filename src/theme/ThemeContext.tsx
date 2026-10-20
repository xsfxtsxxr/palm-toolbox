/**
 * 主题上下文：浅色 / 深色 / 跟随系统
 *
 * 用法：
 *   const colors = useThemeColors();
 *   const styles = useThemedStyles(makeStyles);   // makeStyles = (colors: Palette) => StyleSheet.create({...})
 *
 * 说明：早期页面在样式表里手写了少量浅色值，深色模式下由 useThemedStyles 按 DARK_REMAP
 * 统一改写，避免每个文件都去改样式表。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  colors as lightColors,
  darkColors,
  DARK_REMAP,
  tileThemes as lightTiles,
  tileThemesDark,
  type Palette,
  type TileTheme,
  type TileThemeKey,
} from './theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme_mode';

interface ThemeContextValue {
  /** 用户设置：浅色 / 深色 / 跟随系统 */
  mode: ThemeMode;
  /** 当前实际生效的外观 */
  scheme: ColorScheme;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  /** 夜间模式开关（打开 = dark，关闭 = light） */
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  scheme: 'light',
  colors: lightColors,
  setMode: () => {},
  setDark: () => {},
});

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // 读取本地偏好（异步，失败则维持「跟随系统」）
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        if (isThemeMode(raw)) setModeState(raw);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const setDark = useCallback(
    (dark: boolean) => {
      setMode(dark ? 'dark' : 'light');
    },
    [setMode],
  );

  const scheme: ColorScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const palette = scheme === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors: palette, setMode, setDark }),
    [mode, scheme, palette, setMode, setDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

/** 当前调色板 */
export const useThemeColors = (): Palette => useContext(ThemeContext).colors;

/** 当前图标 Tile 配色（深色模式下换成低饱和底） */
export const useTileThemes = (): Record<TileThemeKey, TileTheme> =>
  useContext(ThemeContext).scheme === 'dark' ? tileThemesDark : lightTiles;

/** 按主题重建样式表（浅色直接用，深色额外做一次历史硬编码色改写） */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors, scheme } = useTheme();
  return useMemo(() => {
    const styles = factory(colors);
    return scheme === 'dark' ? (remapDeep(styles, DARK_REMAP) as T) : styles;
  }, [factory, colors, scheme]);
}

/** 递归改写样式对象里的颜色字符串 */
function remapDeep(value: unknown, map: Record<string, string>): unknown {
  if (typeof value === 'string') return map[value] ?? value;
  if (Array.isArray(value)) return value.map((item) => remapDeep(item, map));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = remapDeep(item, map);
    }
    return out;
  }
  return value;
}
