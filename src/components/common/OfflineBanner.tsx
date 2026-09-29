// =============================================
// EVI - Offline Banner
// Shown app-wide whenever the device has no connection, so screens
// never just look broken or stuck loading.
// =============================================

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, FontWeights, Spacing } from '../../theme/colors';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const offline = !isConnected || isInternetReachable === false;
  const insets = useSafeAreaInsets();
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(height, {
      toValue: offline ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [offline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          paddingTop: insets.top,
          height: height.interpolate({ inputRange: [0, 1], outputRange: [0, insets.top + 36] }),
          opacity: height,
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text style={styles.text}>You're offline — showing saved data</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  text: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
});
