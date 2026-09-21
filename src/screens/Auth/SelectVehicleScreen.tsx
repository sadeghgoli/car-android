import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Spacing } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  listRegisteredVehicles,
  mapApiVehicleToTabletVehicle,
  selectVehicle,
} from '../../services/vehicleCatalogService';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectVehicle'>;

type Row = ReturnType<typeof mapApiVehicleToTabletVehicle>;

export function SelectVehicleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [submittingId, setSubmittingId] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        setLoading(true);
        setError(undefined);
        try {
          const rows = await listRegisteredVehicles();
          if (cancelled) return;
          setItems(rows.map(mapApiVehicleToTabletVehicle));
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'بارگذاری خودروها ناموفق بود');
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleSelect = async (vehicle: Row) => {
    setSubmittingId(vehicle.id);
    try {
      const raw = await listRegisteredVehicles();
      const match = raw.find((row) => row.id === vehicle.id);
      if (!match) {
        throw new Error('خودرو یافت نشد');
      }
      await selectVehicle(match);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'انتخاب خودرو ناموفق بود');
    } finally {
      setSubmittingId(undefined);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="انتخاب خودرو" />
      <Text style={styles.subtitle}>خودرویی که با آن مأموریت انجام می‌دهید را انتخاب کنید.</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {error && !loading ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.screenHorizontal, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              disabled={submittingId === item.id}
              onPress={() => void handleSelect(item)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.plate}</Text>
              {submittingId === item.id ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            !error ? <Text style={styles.empty}>خودروی فعالی در سامانه ثبت نشده است.</Text> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: Fonts.regular,
    color: '#dc2626',
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  empty: {
    fontFamily: Fonts.regular,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: Spacing.xl,
  },
});
