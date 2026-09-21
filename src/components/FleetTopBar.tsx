import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Images } from '../assets';
import { Colors, Fonts, Radius, Strings } from '../constants';
import type { AppUser } from '../types/domain';
import { toFaDigits } from '../utils/format';
import { createShadow } from '../utils/shadow';

type FleetTopBarProps = {
  user: AppUser | null;
  unread: number;
  openCount: number;
  speeding: boolean;
  onProfile: () => void;
  onNotifications: () => void;
  onOpenRequests: () => void;
  onSettings?: () => void;
};

export function FleetTopBar({
  user,
  unread,
  openCount,
  speeding,
  onProfile,
  onNotifications,
  onOpenRequests,
  onSettings,
}: FleetTopBarProps) {
  const avatar = user?.avatarKey === 'user2' ? Images.user2 : Images.user1;

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.avatarButton}
        onPress={onProfile}
        accessibilityRole="button"
        accessibilityLabel={Strings.home.profileAccessibility}
      >
        <Image source={avatar} style={styles.avatar} />
      </Pressable>

      <Pressable
        style={styles.iconButton}
        onPress={onNotifications}
        accessibilityRole="button"
        accessibilityLabel={Strings.home.notificationsAccessibility}
      >
        <Ionicons
          name="notifications-outline"
          size={22}
          color={unread > 0 ? Colors.critical : Colors.textPrimary}
        />
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unread > 9 ? '۹+' : toFaDigits(unread)}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        style={styles.iconButton}
        onPress={onOpenRequests}
        accessibilityRole="button"
        accessibilityLabel={Strings.home.openRequestsAccessibility}
      >
        <Ionicons name="layers-outline" size={22} color={Colors.textPrimary} />
        {openCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{toFaDigits(openCount)}</Text>
          </View>
        ) : null}
      </Pressable>

      {speeding ? (
        <View
          style={[styles.iconButton, styles.speed]}
          accessibilityLabel={Strings.home.speedAlertAccessibility}
        >
          <Ionicons name="speedometer" size={20} color={Colors.white} />
        </View>
      ) : null}

      {user?.role === 'admin' && onSettings ? (
        <Pressable
          style={styles.iconButton}
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.settingsAccessibility}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...createShadow({ offsetY: 4, blur: 12, opacity: 0.12, elevation: 6 }),
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.illustrationBackground,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.illustrationBackground,
  },
  speed: {
    backgroundColor: Colors.speedAlert,
  },
  badge: {
    position: 'absolute',
    top: -2,
    left: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 9,
  },
});
