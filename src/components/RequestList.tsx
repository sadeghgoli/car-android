import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Spacing, Strings } from '../constants';
import type { VehicleRequest } from '../types/domain';
import { formatDateFa, priorityLabel, statusLabel, toFaDigits } from '../utils/format';

type RequestListProps = {
  requests: VehicleRequest[];
  onPress: (request: VehicleRequest) => void;
  regionTitle?: string;
};

function statusColor(request: VehicleRequest): string {
  if (request.status === 'in_progress') {
    return Colors.inProgress;
  }
  if (request.status === 'completed') {
    return Colors.completed;
  }
  if (request.status === 'cancelled' || request.status === 'incomplete') {
    return Colors.cancelled;
  }
  return request.priority === 'critical' ? Colors.critical : Colors.normal;
}

export function RequestList({ requests, onPress, regionTitle }: RequestListProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{Strings.home.requests}</Text>
      <Text style={styles.hint}>
        {regionTitle
          ? `محدوده پلیگانی ${regionTitle} — فقط درخواست‌های همین منطقه`
          : Strings.home.radiusHint}
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {requests.length === 0 ? (
          <Text style={styles.empty}>{Strings.home.empty}</Text>
        ) : (
          requests.map((request) => (
            <Pressable
              key={request.id}
              onPress={() => onPress(request)}
              style={styles.card}
            >
              <View
                style={[styles.priority, { backgroundColor: statusColor(request) }]}
              />
              <View style={styles.body}>
                <View style={styles.row}>
                  <Text style={styles.code}>{request.trackingCode}</Text>
                  <Text
                    style={[
                      styles.badge,
                      { color: statusColor(request) },
                    ]}
                  >
                    {priorityLabel(request.priority)}
                  </Text>
                </View>
                <Text style={styles.title}>{request.title}</Text>
                <Text style={styles.meta}>
                  {statusLabel(request.status)} · {formatDateFa(request.receivedAt)}
                </Text>
                <Text style={styles.address} numberOfLines={1}>
                  {request.addressLabel}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
      <Text style={styles.count}>
        {toFaDigits(requests.length)} درخواست
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 360,
    backgroundColor: Colors.panel,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  heading: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: Spacing.md,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: Spacing.md,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  priority: {
    width: 6,
  },
  body: {
    flex: 1,
    padding: Spacing.sm,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  badge: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  address: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  count: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
