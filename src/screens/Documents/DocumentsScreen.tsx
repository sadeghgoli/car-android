import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { Colors, Fonts, Radius, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  addRequestMedia,
  createMedia,
  getRequestById,
  updateRequest,
} from '../../services/requestService';
import { logEvent } from '../../services/eventService';
import { getCurrentUser } from '../../services/authService';
import { getSettings } from '../../services/settingsService';
import type { RequestMedia, VehicleRequest } from '../../types/domain';

type Props = NativeStackScreenProps<RootStackParamList, 'Documents'>;

export function DocumentsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { requestId, phase } = route.params;
  const [request, setRequest] = useState<VehicleRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [saving, setSaving] = useState(false);

  const title =
    phase === 'before' ? Strings.documents.beforeTitle : Strings.documents.afterTitle;

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const item = await getRequestById(requestId);
        setRequest(item);
        setNotes(
          phase === 'before' ? item?.notesBefore ?? '' : item?.notesAfter ?? '',
        );
      })();
    }, [phase, requestId]),
  );

  const media = request
    ? phase === 'before'
      ? request.docsBefore
      : request.docsAfter
    : [];

  const pickMedia = async (
    kind: 'photo' | 'video',
    source: 'library' | 'camera',
  ) => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(Strings.common.error, 'دسترسی دوربین لازم است');
        return;
      }
    }
    const options = {
      mediaTypes:
        kind === 'photo'
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    const next = await addRequestMedia(
      requestId,
      phase,
      createMedia(kind, asset.uri, asset.fileName ?? `${kind}.jpg`),
    );
    setRequest(next);
  };

  const toggleAudio = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const next = await addRequestMedia(
          requestId,
          phase,
          createMedia('audio', uri, 'voice.m4a'),
        );
        setRequest(next);
      }
      return;
    }
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(Strings.common.error, 'دسترسی میکروفون لازم است');
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const created = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(created.recording);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch =
        phase === 'before' ? { notesBefore: notes } : { notesAfter: notes };
      const next = await updateRequest(requestId, patch);
      setRequest(next);
      if (notes.trim()) {
        const user = await getCurrentUser();
        const settings = await getSettings();
        await logEvent({
          type: 'notes_added',
          userId: user?.id,
          vehicleId: settings.vehicle.id,
          requestId,
          payload: { phase },
        });
      }
      if (phase === 'before') {
        navigation.replace('Documents', { requestId, phase: 'after' });
      } else {
        navigation.replace('CompleteRequest', { requestId });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
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
        <View style={styles.actions}>
          <IconAction
            icon="image-outline"
            label={Strings.documents.addPhoto}
            onPress={() => void pickMedia('photo', 'library')}
          />
          <IconAction
            icon="camera-outline"
            label={Strings.documents.takePhoto}
            onPress={() => void pickMedia('photo', 'camera')}
          />
          <IconAction
            icon="videocam-outline"
            label={Strings.documents.addVideo}
            onPress={() => void pickMedia('video', 'library')}
          />
          <IconAction
            icon="videocam"
            label={Strings.documents.takeVideo}
            onPress={() => void pickMedia('video', 'camera')}
          />
          <IconAction
            icon={recording ? 'stop-circle-outline' : 'mic-outline'}
            label={recording ? Strings.documents.stopAudio : Strings.documents.addAudio}
            onPress={() => void toggleAudio()}
          />
        </View>

        {media.length === 0 ? (
          <Text style={styles.empty}>{Strings.documents.empty}</Text>
        ) : (
          media.map((item) => <MediaRow key={item.id} item={item} />)
        )}

        <TextField
          label={Strings.documents.notes}
          placeholder={Strings.documents.notesPlaceholder}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.notes}
        />
        <PrimaryButton
          label={Strings.documents.save}
          onPress={() => void handleSave()}
          loading={saving}
        />
      </ScrollView>
    </View>
  );
}

function IconAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Ionicons name={icon} size={22} color={Colors.primaryDark} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function MediaRow({ item }: { item: RequestMedia }) {
  const label =
    item.kind === 'photo' ? 'عکس' : item.kind === 'video' ? 'فیلم' : 'صوت';
  return (
    <View style={styles.media}>
      <Text style={styles.mediaName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.mediaKind}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  action: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  empty: {
    textAlign: 'center',
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  mediaKind: {
    fontFamily: Fonts.medium,
    color: Colors.primaryDark,
  },
  mediaName: {
    flex: 1,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  notes: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
