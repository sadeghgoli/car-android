import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import { MUNICIPAL_REGIONS } from '../../constants/regions';
import type { RootStackParamList } from '../../navigation/types';
import { getCurrentUser } from '../../services/authService';
import { getSettings, saveSettings } from '../../services/settingsService';
import type { TabletSettings } from '../../types/domain';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [allowed, setAllowed] = useState(true);
  const [form, setForm] = useState<TabletSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const user = await getCurrentUser();
        if (user?.role !== 'admin') {
          setAllowed(false);
          return;
        }
        setAllowed(true);
        setForm(await getSettings());
      })();
    }, []),
  );

  const patchVehicle = (key: keyof TabletSettings['vehicle'], value: string) => {
    if (!form) {
      return;
    }
    setForm({
      ...form,
      vehicle: { ...form.vehicle, [key]: value },
    });
  };

  const handleSave = async () => {
    if (!form) {
      return;
    }
    await saveSettings({
      ...form,
      maxSpeedKmh: Number(form.maxSpeedKmh) || 60,
    });
    Alert.alert(Strings.settings.saved);
    navigation.goBack();
  };

  if (!allowed) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title={Strings.settings.title} onBack={() => navigation.goBack()} />
        <Text style={styles.denied}>{Strings.settings.onlyAdmin}</Text>
      </View>
    );
  }

  if (!form) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title={Strings.settings.title} onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={Strings.settings.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: insets.bottom + Spacing.xl,
          gap: Spacing.md,
          maxWidth: 720,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        <TextField
          label={Strings.settings.maxSpeed}
          keyboardType="numeric"
          value={String(form.maxSpeedKmh)}
          onChangeText={(value) =>
            setForm({ ...form, maxSpeedKmh: Number(value.replace(/[^\d]/g, '')) || 0 })
          }
        />
        <Pressable
          style={styles.switchRow}
          onPress={() =>
            setForm({ ...form, allowNewWhileOpen: !form.allowNewWhileOpen })
          }
        >
          <Switch
            value={form.allowNewWhileOpen}
            onValueChange={(value) =>
              setForm({ ...form, allowNewWhileOpen: value })
            }
            trackColor={{ true: Colors.primary }}
          />
          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>{Strings.settings.allowNew}</Text>
            <Text style={styles.switchHint}>{Strings.settings.allowNewHint}</Text>
          </View>
        </Pressable>
        <Text style={styles.section}>{Strings.settings.region}</Text>
        <Text style={styles.switchHint}>{Strings.settings.regionHint}</Text>
        <View style={styles.regionRow}>
          {MUNICIPAL_REGIONS.map((region) => {
            const active = form.vehicle.regionId === region.id;
            return (
              <Pressable
                key={region.id}
                onPress={() =>
                  setForm({
                    ...form,
                    vehicle: {
                      ...form.vehicle,
                      regionId: region.id,
                      regionTitle: region.title,
                    },
                  })
                }
                style={[styles.regionChip, active && styles.regionChipActive]}
              >
                <Text style={[styles.regionChipText, active && styles.regionChipTextActive]}>
                  {region.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.section}>{Strings.settings.vehicleSection}</Text>
        <TextField
          label={Strings.settings.plate}
          value={form.vehicle.plate}
          onChangeText={(value) => patchVehicle('plate', value)}
        />
        <TextField
          label={Strings.settings.code}
          value={form.vehicle.code}
          onChangeText={(value) => patchVehicle('code', value)}
        />
        <TextField
          label={Strings.settings.type}
          value={form.vehicle.type}
          onChangeText={(value) => patchVehicle('type', value)}
        />
        <TextField
          label={Strings.settings.model}
          value={form.vehicle.model}
          onChangeText={(value) => patchVehicle('model', value)}
        />
        <TextField
          label={Strings.settings.titleField}
          value={form.vehicle.title}
          onChangeText={(value) => patchVehicle('title', value)}
        />
        <TextField
          label={Strings.settings.unit}
          value={form.vehicle.unit}
          onChangeText={(value) => patchVehicle('unit', value)}
        />
        <PrimaryButton label={Strings.common.save} onPress={() => void handleSave()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  denied: {
    marginTop: Spacing.xl,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
  },
  section: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: Spacing.sm,
  },
  regionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  regionChip: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  regionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  regionChipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  regionChipTextActive: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: Spacing.md,
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  switchHint: {
    marginTop: 4,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
});
