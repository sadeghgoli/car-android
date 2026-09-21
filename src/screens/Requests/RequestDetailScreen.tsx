import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { getSnapshot } from '../../services/locationService';
import {
  canAcceptNewRequest,
  getRequestById,
  startOperation,
} from '../../services/requestService';
import type { VehicleRequest } from '../../types/domain';
import { formatDateFa, priorityLabel, statusLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

export function RequestDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<VehicleRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setRequest(await getRequestById(route.params.requestId));
      })();
    }, [route.params.requestId]),
  );

  const handleStart = async () => {
    if (!request) {
      return;
    }
    const allowed = await canAcceptNewRequest();
    if (!allowed && request.status === 'referred') {
      Alert.alert(Strings.common.error, Strings.requestDetail.blocked);
      return;
    }
    setLoading(true);
    try {
      const next = await startOperation(request.id, getSnapshot().coordinate);
      setRequest(next);
      navigation.navigate('Documents', { requestId: next.id, phase: 'before' });
    } catch (error) {
      Alert.alert(
        Strings.common.error,
        error instanceof Error ? error.message : 'شروع عملیات ناموفق بود',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader
          title={Strings.requestDetail.title}
          onBack={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.requestDetail.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: insets.bottom + Spacing.xl,
          gap: Spacing.md,
          maxWidth: 780,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={styles.card}>
          <Text style={styles.code}>{request.trackingCode}</Text>
          <Text style={styles.status}>
            {statusLabel(request.status)} · {priorityLabel(request.priority)}
          </Text>
          <InfoRow label={Strings.requestDetail.type} value={request.type} />
          <InfoRow
            label={Strings.requestDetail.date}
            value={formatDateFa(request.createdAt)}
          />
          <InfoRow
            label={Strings.requestDetail.location}
            value={request.addressLabel}
          />
        </View>

        <Section title={Strings.requestDetail.description} body={request.description} />
        {request.operatorNotes ? (
          <Section
            title={Strings.requestDetail.operatorNotes}
            body={request.operatorNotes}
          />
        ) : null}
        {request.referralNotes ? (
          <Section
            title={Strings.requestDetail.referralNotes}
            body={request.referralNotes}
          />
        ) : null}
        <Section
          title={Strings.requestDetail.citizenFiles}
          body={
            request.citizenAttachments.length
              ? request.citizenAttachments.map((item) => item.name).join('، ')
              : 'فایلی ارسال نشده است'
          }
        />

        {request.status === 'referred' ? (
          <PrimaryButton
            label={Strings.requestDetail.start}
            onPress={() => void handleStart()}
            loading={loading}
          />
        ) : null}

        {request.status === 'in_progress' ? (
          <View style={styles.actions}>
            <PrimaryButton
              label={Strings.requestDetail.docsBefore}
              onPress={() =>
                navigation.navigate('Documents', {
                  requestId: request.id,
                  phase: 'before',
                })
              }
            />
            <PrimaryButton
              label={Strings.requestDetail.docsAfter}
              onPress={() =>
                navigation.navigate('Documents', {
                  requestId: request.id,
                  phase: 'after',
                })
              }
            />
            <PrimaryButton
              label={Strings.requestDetail.finish}
              onPress={() =>
                navigation.navigate('CompleteRequest', { requestId: request.id })
              }
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
  },
  code: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  status: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  infoValue: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actions: {
    gap: Spacing.sm,
  },
});
