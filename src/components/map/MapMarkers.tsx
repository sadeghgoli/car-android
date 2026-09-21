import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants';
import type { VehicleRequest } from '../../types/domain';

export function requestPinColor(request: VehicleRequest): string {
  if (request.status === 'in_progress') {
    return Colors.inProgress;
  }
  return request.priority === 'critical' ? Colors.critical : Colors.normal;
}

export function RequestMapPin({ color }: { color: string }) {
  return (
    <View style={styles.pinWrap} pointerEvents="none">
      <View style={[styles.pinHead, { backgroundColor: color }]}>
        <View style={styles.pinInner} />
      </View>
      <View style={[styles.pinTip, { borderTopColor: color }]} />
    </View>
  );
}

export function VehicleMapPuck() {
  return (
    <View style={styles.puckWrap} pointerEvents="none">
      <View style={styles.puckHalo} />
      <View style={styles.puckCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    width: 28,
    alignItems: 'center',
  },
  pinHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  puckWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(47, 200, 150, 0.22)',
  },
  puckCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryDark,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
});
