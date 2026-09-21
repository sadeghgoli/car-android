import React, { useEffect } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, fontAssets } from './constants';
import { AppNavigator } from './navigation/AppNavigator';
import { enableRTL } from './utils/rtl';

enableRTL();

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    enableRTL();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root} collapsable={false}>
          <AppNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
