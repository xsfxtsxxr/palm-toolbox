/**
 * 流水行左滑控制器（不依赖任何新增手势库）
 *
 * 用闭包保存位移 / 起始位置 / 展开状态，组件只消费返回的 panHandlers 与命令方法，
 * 避免在渲染期读写 ref，同时保证一条记录只会创建一次手势对象。
 */
import { Animated, PanResponder } from 'react-native';

export const ACTION_WIDTH = 144;

export interface SwipeRow {
  translateX: Animated.Value;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
  /** 当前是否处于展开（露出操作按钮）状态 */
  isOpen: () => boolean;
  /** 收起操作区 */
  close: () => void;
}

export function createSwipeRow(): SwipeRow {
  const translateX = new Animated.Value(0);
  let startX = 0;
  let open = false;

  const animateTo = (value: number) => {
    open = value !== 0;
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      bounciness: 0,
      speed: 18,
    }).start();
  };

  const panResponder = PanResponder.create({
    // 仅当横向位移明显大于纵向时才接管，避免影响列表滚动
    onMoveShouldSetPanResponder: (_, state) =>
      Math.abs(state.dx) > 6 && Math.abs(state.dx) > Math.abs(state.dy) * 1.4,
    onPanResponderGrant: () => {
      translateX.stopAnimation((value) => {
        startX = value;
      });
    },
    onPanResponderMove: (_, state) => {
      translateX.setValue(Math.max(-ACTION_WIDTH, Math.min(0, startX + state.dx)));
    },
    onPanResponderRelease: (_, state) => {
      const finalX = startX + state.dx;
      const shouldOpen = finalX < -ACTION_WIDTH / 2 || state.vx < -0.35;
      animateTo(shouldOpen ? -ACTION_WIDTH : 0);
    },
    onPanResponderTerminate: () => {
      animateTo(open ? -ACTION_WIDTH : 0);
    },
  });

  return {
    translateX,
    panHandlers: panResponder.panHandlers,
    isOpen: () => open,
    close: () => animateTo(0),
  };
}
