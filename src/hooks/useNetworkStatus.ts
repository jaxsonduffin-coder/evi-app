// =============================================
// EVI - Network Status Hook
// Tracks connectivity so screens can show a clear "you're offline"
// state instead of a spinner that never resolves.
// =============================================

import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

let latestStatus: NetworkStatus = { isConnected: true, isInternetReachable: true };
const listeners = new Set<(status: NetworkStatus) => void>();

NetInfo.addEventListener((state: NetInfoState) => {
  latestStatus = {
    isConnected: !!state.isConnected,
    isInternetReachable: state.isInternetReachable,
  };
  listeners.forEach((l) => l(latestStatus));
});

/** True when the device has no network connection at all (not just a slow/unreachable one). */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(latestStatus);

  useEffect(() => {
    listeners.add(setStatus);
    // Refresh immediately in case the initial event already fired before mount
    NetInfo.fetch().then((state) => {
      latestStatus = {
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
      };
      setStatus(latestStatus);
    });
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return status;
}

/** Non-hook accessor for one-off checks (e.g. before firing a network call). */
export function isOnline(): boolean {
  return latestStatus.isConnected && latestStatus.isInternetReachable !== false;
}
