import React, { forwardRef, Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { HomeMapHandle, HomeMapProps } from './types';

function hasMapLibreNative(): boolean {
  try {
    return TurboModuleRegistry.get('MLRNCameraModule') != null;
  } catch {
    return false;
  }
}

type ErrBoundaryState = { error: Error | null };

class MapNativeErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrBoundaryState
> {
  state: ErrBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function MissingNativeBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>نقشه Native آماده نیست</Text>
      <Text style={styles.body}>
        الان Expo Go باز است یا Dev Client بدون MapLibre نصب شده. برای نقشه باید
        اپ اختصاصی ساخته شود:
      </Text>
      <Text style={styles.code}>npx expo run:android</Text>
      <Text style={styles.body}>
        بعد اپ «ارجاع خودرو ۱۳۷» را باز کنید — نه Expo Go.
      </Text>
    </View>
  );
}

export const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(
  function HomeMap(props, ref) {
    if (!hasMapLibreNative()) {
      return <MissingNativeBanner />;
    }

    const { SabzevarMapNative } =
      require('./SabzevarMapNative') as typeof import('./SabzevarMapNative');

    return (
      <MapNativeErrorBoundary fallback={<MissingNativeBanner />}>
        <SabzevarMapNative ref={ref} {...props} />
      </MapNativeErrorBoundary>
    );
  },
);

const styles = StyleSheet.create({
  banner: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#d9e2ec',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#273247',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#273247',
  },
  code: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: '#111',
  },
});
