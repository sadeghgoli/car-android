import React from 'react';
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../assets';
import { Colors, Radius } from '../constants';
import { createShadow } from '../utils/shadow';

type AuthHeaderProps = {
  heightRatio?: number;
};

export function AuthHeader({ heightRatio = 0.34 }: AuthHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const headerHeight = Math.max(height * heightRatio, 200) + insets.top;
  const logoSize = Math.min(width * 0.22, height * 0.28, 180);

  return (
    <View
      style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}
    >
      <View style={[styles.logoCard, { width: logoSize, height: logoSize }]}>
        <Image
          source={Images.logo}
          style={{
            width: logoSize,
            height: logoSize,
          }}
          resizeMode="contain"
          accessibilityLabel="لوگوی سامانه ۱۳۷"
        />
      </View>
      <Image
        source={Images.cityBackground}
        style={[styles.city, { width, height: headerHeight * 0.42 }]}
        resizeMode="cover"
        accessible={false}
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.splashBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoCard: {
    zIndex: 2,
    marginBottom: 20,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    ...createShadow({ offsetY: 6, blur: 12, opacity: 0.15, elevation: 8 }),
  },
  city: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
