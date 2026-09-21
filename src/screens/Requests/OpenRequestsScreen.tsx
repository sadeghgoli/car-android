import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Radius, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { getInProgressRequests, setActiveRequestId } from '../../services/requestService';
import type { VehicleRequest } from '../../types/domain';
import { formatDateFa, priorityLabel, statusLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'OpenRequests'>;

export function OpenRequestsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<VehicleRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      void getInProgressRequests().then(setItems);
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.openRequests.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: insets.bottom + Spacing.xl,
          gap: Spacing.sm,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {items.length === 0 ? (
          <Text style={styles.empty}>{Strings.openRequests.empty}</Text>
        ) : (
          items.map((request) => (
            <Pressable
              key={request.id}
              style={styles.card}
              onPress={() => {
                void setActiveRequestId(request.id);
                navigation.navigate('RequestDetail', { requestId: request.id });
              }}
            >
              <Text style={styles.code}>{request.trackingCode}</Text>
              <Text style={styles.title}>{request.title}</Text>
              <Text style={styles.meta}>
                {statusLabel(request.status)} · {priorityLabel(request.priority)} ·{' '}
                {formatDateFa(request.startedAt ?? request.receivedAt)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  empty: {
    marginTop: Spacing.xl,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  code: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
