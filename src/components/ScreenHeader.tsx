import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Strings } from '../constants';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + Spacing.sm, paddingLeft: insets.left + Spacing.md },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={Strings.common.back}
        style={styles.back}
      >
        <Ionicons name="arrow-forward" size={22} color={Colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  back: {
    width: 28,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
});
