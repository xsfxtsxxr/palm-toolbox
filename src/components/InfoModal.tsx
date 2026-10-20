/** 说明弹窗（等额本息 / 数据说明） */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { PickerModal } from './PickerModal';
import { useThemedStyles } from '../theme/ThemeContext';
import type { Palette } from '../theme/theme';

interface Props {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export const InfoModal: React.FC<Props> = ({ visible, title, content, onClose }) => {
  const styles = useThemedStyles(makeStyles);
  return (
  <PickerModal
    visible={visible}
    title={title}
    onClose={onClose}
    footer={
      <Pressable accessibilityRole="button" style={styles.btn} onPress={onClose}>
        <Text style={styles.btnText}>知道了</Text>
      </Pressable>
    }
  >
    <Text style={styles.content}>{content}</Text>
  </PickerModal>
);
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  content: {
    fontSize: fontSize.body,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  btn: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: fontSize.normal,
    color: colors.white,
    fontWeight: '700',
  },
});
