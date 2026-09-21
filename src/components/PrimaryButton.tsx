import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Typography } from '../constants';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  tone?: 'primary' | 'danger' | 'warning' | 'muted';
};

const TONES = {
  primary: Colors.primary,
  danger: Colors.critical,
  warning: Colors.inProgress,
  muted: Colors.cancelled,
} as const;

export function PrimaryButton({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
  loading = false,
  style,
  tone = 'primary',
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: TONES[tone] },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  label: {
    ...Typography.button,
    color: Colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
});
