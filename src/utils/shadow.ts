import { Platform, ViewStyle } from 'react-native';

type ShadowOptions = {
  offsetY?: number;
  blur?: number;
  opacity?: number;
  elevation?: number;
};

export function createShadow({
  offsetY = 4,
  blur = 12,
  opacity = 0.15,
  elevation = 6,
}: ShadowOptions = {}): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(0,0,0,${opacity})`,
    } as ViewStyle;
  }

  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur / 2,
    elevation,
  };
}
