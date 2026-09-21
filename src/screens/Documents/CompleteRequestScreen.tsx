import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { completeRequest, getRequestById } from '../../services/requestService';
import type { RequestResult, VehicleRequest } from '../../types/domain';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteRequest'>;

export function CompleteRequestScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<VehicleRequest | null>(null);
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [loading, setLoading] = useState<RequestResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getRequestById(route.params.requestId).then(setRequest);
    }, [route.params.requestId]),
  );

  const submit = async (result: RequestResult) => {
    if (!action.trim()) {
      Alert.alert(Strings.common.error, Strings.complete.actionRequired);
      return;
    }
    if (!outcome.trim()) {
      Alert.alert(Strings.common.error, Strings.complete.outcomeRequired);
      return;
    }
    if (!notes.trim()) {
      Alert.alert(Strings.common.error, Strings.complete.notesRequired);
      return;
    }
    if (result === 'completed') {
      const beforePhotos =
        request?.docsBefore.filter((item) => item.kind === 'photo').length ?? 0;
      const afterPhotos =
        request?.docsAfter.filter((item) => item.kind === 'photo').length ?? 0;
      if (beforePhotos < 1 || afterPhotos < 1) {
        Alert.alert(Strings.common.error, Strings.complete.photosRequired);
        return;
      }
    }
    setLoading(result);
    try {
      await completeRequest(route.params.requestId, {
        result,
        finalNotes: notes,
        finalAction: action,
        finalOutcome: outcome,
        needsFollowUp: followUp,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert(
        Strings.common.error,
        error instanceof Error ? error.message : 'ثبت نتیجه ناموفق بود',
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={Strings.complete.title} onBack={() => navigation.goBack()} />
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
        <TextField
          label={`${Strings.complete.action} (${Strings.common.required})`}
          placeholder={Strings.complete.actionPlaceholder}
          value={action}
          onChangeText={setAction}
          multiline
          style={styles.area}
        />
        <TextField
          label={`${Strings.complete.outcome} (${Strings.common.required})`}
          placeholder={Strings.complete.outcomePlaceholder}
          value={outcome}
          onChangeText={setOutcome}
          multiline
          style={styles.area}
        />
        <TextField
          label={`${Strings.complete.finalNotes} (${Strings.common.required})`}
          placeholder={Strings.complete.finalPlaceholder}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.areaLarge}
        />
        <View style={styles.follow}>
          <Switch
            value={followUp}
            onValueChange={setFollowUp}
            trackColor={{ true: Colors.primary }}
          />
          <Text style={styles.followLabel}>{Strings.complete.followUp}</Text>
        </View>
        <PrimaryButton
          label={Strings.complete.complete}
          onPress={() => void submit('completed')}
          loading={loading === 'completed'}
          disabled={loading !== null}
        />
        <PrimaryButton
          label={Strings.complete.incomplete}
          tone="warning"
          onPress={() => void submit('incomplete')}
          loading={loading === 'incomplete'}
          disabled={loading !== null}
        />
        <PrimaryButton
          label={Strings.complete.cancel}
          tone="muted"
          onPress={() => void submit('cancelled')}
          loading={loading === 'cancelled'}
          disabled={loading !== null}
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
  area: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  areaLarge: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  followLabel: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
