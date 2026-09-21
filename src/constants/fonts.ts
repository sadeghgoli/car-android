export const Fonts = {
  regular: 'Vazirmatn-Regular',
  medium: 'Vazirmatn-Medium',
  semiBold: 'Vazirmatn-SemiBold',
  bold: 'Vazirmatn-Bold',
} as const;

export const fontAssets = {
  [Fonts.regular]: require('../assets/fonts/Vazirmatn-Regular.ttf'),
  [Fonts.medium]: require('../assets/fonts/Vazirmatn-Medium.ttf'),
  [Fonts.semiBold]: require('../assets/fonts/Vazirmatn-SemiBold.ttf'),
  [Fonts.bold]: require('../assets/fonts/Vazirmatn-Bold.ttf'),
} as const;
