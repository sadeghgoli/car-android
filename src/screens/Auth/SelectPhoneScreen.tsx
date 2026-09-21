import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { requestOtp } from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectPhone'>;

export function SelectPhoneScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { melliCode, phones } = route.params;
  const [selected, setSelected] = useState(phones[0]?.phoneNumber ?? '');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!selected) {
      Alert.alert(Strings.common.error, 'یک شماره انتخاب کنید');
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(selected, melliCode);
      navigation.navigate('VerifyOtp', {
        melliCode,
        phoneNumber: selected,
        demoCode: result.code,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ارسال کد تایید ناموفق بود';
      Alert.alert(Strings.common.error, message);
    } finally {
      setLoading(false);
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
        title={Strings.login.selectPhoneTitle}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{Strings.login.selectPhoneSubtitle}</Text>
        {phones.map((phone) => {
          const active = phone.phoneNumber === selected;
          return (
            <Pressable
              key={`${phone.id}-${phone.phoneNumber}`}
              onPress={() => setSelected(phone.phoneNumber)}
              style={[styles.phoneCard, active && styles.phoneCardActive]}
            >
              <Text style={styles.phoneText}>{phone.phoneNumber}</Text>
              {phone.isPrimary ? (
                <Text style={styles.primaryBadge}>اصلی</Text>
              ) : null}
            </Pressable>
          );
        })}
        <PrimaryButton
          label={loading ? Strings.login.loading : Strings.login.sendOtp}
          onPress={() => {
            void handleSend();
          }}
          loading={loading}
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  phoneCard: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
  },
  phoneCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.overlay,
  },
  phoneText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  primaryBadge: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  cta: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
});
