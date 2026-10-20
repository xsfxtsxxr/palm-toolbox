/**
 * 监听软键盘高度
 *
 * Expo SDK 54+ / RN 0.81+ 在 Android 上强制 edge-to-edge，
 * `windowSoftInputMode=adjustResize` 不再收缩窗口，
 * 因此 KeyboardAvoidingView 在 Android 上必须自己算高度。
 * 这里统一用 Keyboard 事件取键盘高度，供底部固定栏做 padding 避让。
 */
import { useEffect, useState } from 'react';
import { Keyboard, LayoutAnimation, Platform } from 'react-native';

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS 用 willShow / willHide 与键盘动画同步，Android 只有 didShow / didHide
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      // iOS 上与键盘弹出动画同步过渡，避免底部栏「跳」上去
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setHeight(Math.max(0, Math.round(event.endCoordinates.height)));
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return height;
}

/**
 * 底部固定栏的安全内边距：
 * 键盘弹起时让位给键盘，收起时让位给系统手势条 / 导航栏。
 */
export function useBottomInset(baseInset: number): number {
  const keyboardHeight = useKeyboardHeight();
  return keyboardHeight > 0 ? Math.max(keyboardHeight, baseInset) : baseInset;
}
