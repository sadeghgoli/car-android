import { TextStyle } from 'react-native';
import { Colors } from './colors';
import { Fonts } from './fonts';

export const Typography = {
  splashTitle: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    color: Colors.white,
    letterSpacing: 0.5,
    writingDirection: 'rtl',
  } satisfies TextStyle,
  heading: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  } satisfies TextStyle,
  body: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    writingDirection: 'rtl',
  } satisfies TextStyle,
  button: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    letterSpacing: 0,
    writingDirection: 'rtl',
  } satisfies TextStyle,
  link: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  } satisfies TextStyle,
} as const;
