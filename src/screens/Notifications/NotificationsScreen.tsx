import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Radius, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  getNotifications,
  markAllRead,
} from '../../services/notificationService';
import type { AppNotification } from '../../types/domain';
import { formatDateFa } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const next = await getNotifications();
        setItems(next);
        await markAllRead();
      })();
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.notifications.title}
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
          <Text style={styles.empty}>{Strings.notifications.empty}</Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, !item.read && styles.unread]}
              onPress={() => {
                if (item.requestId) {
                  navigation.navigate('RequestDetail', { requestId: item.requestId });
                }
              }}
            >
              <Text style={styles.title}>{item.title}</Text>
              {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
              <Text style={styles.meta}>{formatDateFa(item.createdAt)}</Text>
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
  unread: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
