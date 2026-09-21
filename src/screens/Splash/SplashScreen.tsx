import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Images } from '../../assets';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { isAuthenticated } from '../../services/authService';
import { hasSelectedVehicle } from '../../services/vehicleCatalogService';
import { createShadow } from '../../utils/shadow';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SPLASH_DURATION_MS = 1600;

export function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Colors.splashBackground);
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('light-content');
      RNStatusBar.setBackgroundColor(Colors.splashBackground);
      RNStatusBar.setTranslucent(true);
    }

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    let cancelled = false;
    const timer = setTimeout(async () => {
      const authed = await isAuthenticated();
      const vehicleReady = authed ? await hasSelectedVehicle() : false;
      if (cancelled) {
        return;
      }
      if (!authed) {
        navigation.replace('Login');
      } else if (!vehicleReady) {
        navigation.replace('SelectVehicle');
      } else {
        navigation.replace('Home');
      }
    }, SPLASH_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      void SystemUI.setBackgroundColorAsync(Colors.background);
      if (Platform.OS === 'android') {
        RNStatusBar.setBarStyle('dark-content');
        RNStatusBar.setBackgroundColor(Colors.background);
      }
    };
  }, [logoOpacity, logoScale, navigation]);

  const logoWidth = Math.min(width * 0.26, height * 0.48, 280);
  const logoHeight = logoWidth;
  const cityHeight = Math.min(height * 0.22, 180);

  return (
    <View
      style={styles.container}
      accessibilityLabel={Strings.splashAccessibility}
    >
      <StatusBar style="light" />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoShadow,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={Images.logo}
            style={{ width: logoWidth, height: logoHeight }}
            resizeMode="contain"
            accessibilityLabel={Strings.logoAccessibility}
          />
        </Animated.View>
        <Animated.View style={{ opacity: logoOpacity }}>
          <Text style={styles.system}>{Strings.brand.system}</Text>
          <Text style={styles.city}>{Strings.brand.city}</Text>
        </Animated.View>
      </View>
      <Image
        source={Images.cityBackground}
        style={[styles.cityBg, { width, height: cityHeight }]}
        resizeMode="cover"
        accessible={false}
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.splashBackground,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoShadow: {
    ...createShadow({ offsetY: 8, blur: 16, opacity: 0.18, elevation: 10 }),
    marginBottom: Spacing.md,
  },
  system: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  city: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cityBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
