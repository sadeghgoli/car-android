import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FleetTopBar } from '../../components/FleetTopBar';
import { RequestList } from '../../components/RequestList';
import {
  HomeMap,
  type HomeMapHandle,
} from '../../components/map/HomeMap';
import {
  Colors,
  DEFAULT_MAP_REGION,
  Fonts,
  Spacing,
} from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { getCurrentUser, logout } from '../../services/authService';
import {
  getSnapshot,
  setFollowRoute,
  startTracking,
  subscribeLocation,
} from '../../services/locationService';
import {
  getNotifications,
  getUnreadCount,
  subscribeNotifications,
} from '../../services/notificationService';
import {
  getActiveRequestId,
  getInProgressRequests,
  getRequests,
  injectLiveRequest,
  markRequestViewed,
  subscribeRequests,
} from '../../services/requestService';
import { getSettings, subscribeSettings } from '../../services/settingsService';
import type {
  AppUser,
  TabletSettings,
  VehicleRequest,
  VehicleSnapshot,
} from '../../types/domain';
import { getRegionById, isCoordinateInRegion } from '../../constants/regions';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<HomeMapHandle>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [settings, setSettings] = useState<TabletSettings | null>(null);
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [unread, setUnread] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<VehicleSnapshot>(getSnapshot());

  const refresh = useCallback(async () => {
    const [nextUser, nextSettings, nextRequests, count, inProgress, active] =
      await Promise.all([
        getCurrentUser(),
        getSettings(),
        getRequests(),
        getUnreadCount(),
        getInProgressRequests(),
        getActiveRequestId(),
      ]);
    setUser(nextUser);
    setSettings(nextSettings);
    setRequests(nextRequests);
    setUnread(count);
    setOpenCount(inProgress.length);
    setActiveId(active);
    const activeRequest = nextRequests.find((item) => item.id === active);
    setFollowRoute(activeRequest?.route ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    void startTracking();
    const unsubLoc = subscribeLocation(setSnapshot);
    const unsubReq = subscribeRequests((items) => {
      setRequests(items);
      setOpenCount(items.filter((item) => item.status === 'in_progress').length);
    });
    const unsubNtf = subscribeNotifications((items) => {
      setUnread(items.filter((item) => !item.read).length);
    });
    const unsubSet = subscribeSettings(setSettings);
    const liveTimer = setTimeout(() => {
      void injectLiveRequest();
    }, 9000);
    const poll = setInterval(() => {
      void getUnreadCount().then(setUnread);
      void getNotifications();
    }, 4000);
    return () => {
      unsubLoc();
      unsubReq();
      unsubNtf();
      unsubSet();
      clearTimeout(liveTimer);
      clearInterval(poll);
    };
  }, []);

  const regionId = settings?.vehicle.regionId;
  const coveragePolygon = useMemo(
    () => getRegionById(regionId)?.polygon ?? null,
    [regionId],
  );

  const visibleRequests = useMemo(() => {
    return requests.filter((item) => {
      if (item.status === 'completed' || item.status === 'cancelled' || item.status === 'incomplete') {
        return false;
      }
      if (item.status === 'in_progress') {
        return true;
      }
      return isCoordinateInRegion(
        { latitude: item.latitude, longitude: item.longitude },
        regionId,
      );
    });
  }, [requests, regionId]);

  const mapRequests = visibleRequests;

  const listRequests = useMemo(
    () =>
      visibleRequests.filter(
        (item) => item.status === 'referred' || item.status === 'in_progress',
      ),
    [visibleRequests],
  );

  const activeRoute = useMemo(
    () => requests.find((item) => item.id === activeId)?.route ?? [],
    [activeId, requests],
  );

  const openDetail = async (request: VehicleRequest) => {
    await markRequestViewed(request.id);
    navigation.navigate('RequestDetail', { requestId: request.id });
  };

  const handleLogout = () => {
    Alert.alert('خروج', 'از حساب خارج می‌شوید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: () => {
          void logout().then(() => {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <HomeMap
        ref={mapRef}
        region={DEFAULT_MAP_REGION}
        requests={mapRequests}
        vehicleCoordinate={snapshot.coordinate}
        coveragePolygon={coveragePolygon}
        routeCoordinates={activeRoute}
        onRequestPress={(request) => {
          void openDetail(request);
        }}
      />

      <View style={styles.listDock}>
        <RequestList
          requests={listRequests}
          regionTitle={settings?.vehicle.regionTitle}
          onPress={(request) => {
            void openDetail(request);
          }}
        />
      </View>

      <View
        style={[
          styles.topBar,
          { top: insets.top + Spacing.sm, left: insets.left + Spacing.md },
        ]}
      >
        <FleetTopBar
          user={user}
          unread={unread}
          openCount={openCount}
          speeding={snapshot.speeding}
          onProfile={handleLogout}
          onNotifications={() => navigation.navigate('Notifications')}
          onOpenRequests={() => navigation.navigate('OpenRequests')}
          onSettings={
            user?.role === 'admin'
              ? () => navigation.navigate('Settings')
              : undefined
          }
        />
        {snapshot.speeding ? (
          <Pressable style={styles.speedBanner}>
            <Text style={styles.speedText}>
              عبور از سرعت مجاز — {Math.round(snapshot.speedKmh)} کیلومتر بر ساعت
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listDock: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
  topBar: {
    position: 'absolute',
    alignItems: 'flex-start',
    gap: 8,
  },
  speedBanner: {
    backgroundColor: Colors.critical,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  speedText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: 12,
    writingDirection: 'rtl',
  },
});
