import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { loginWithOtp, requestOtp } from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyOtp'>;

export function VerifyOtpScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { melliCode, phoneNumber, demoCode } = route.params;
  const [otp, setOtp] = useState(demoCode ?? '');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'SelectVehicle' }],
    });
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError(Strings.login.otpRequired);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await loginWithOtp(phoneNumber, otp, melliCode);
      goHome();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'تایید کد ناموفق بود';
      Alert.alert(Strings.common.error, message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await requestOtp(phoneNumber, melliCode);
      if (result.code) {
        setOtp(result.code);
      }
      Alert.alert('موفق', 'کد تایید مجدد ارسال شد');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ارسال مجدد ناموفق بود';
      Alert.alert(Strings.common.error, message);
    } finally {
      setResending(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
      ]}
    >
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.login.otpTitle}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.subtitle}>{Strings.login.otpSubtitle}</Text>
        <Text style={styles.phone}>{phoneNumber}</Text>
        <TextField
          value={otp}
          onChangeText={setOtp}
          placeholder={Strings.login.otpPlaceholder}
          keyboardType="number-pad"
          error={error}
          maxLength={6}
        />
        <PrimaryButton
          label={loading ? Strings.login.loading : Strings.login.verifyOtp}
          onPress={() => {
            void handleVerify();
          }}
          loading={loading}
          style={styles.cta}
        />
        <PrimaryButton
          label={Strings.login.resendOtp}
          onPress={() => {
            void handleResend();
          }}
          loading={resending}
          style={styles.secondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  phone: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cta: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  secondary: {
    alignSelf: 'stretch',
    backgroundColor: Colors.textPrimary,
  },
});
