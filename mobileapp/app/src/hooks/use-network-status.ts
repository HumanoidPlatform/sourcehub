import { useNetInfo } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const netInfo = useNetInfo();
  const isInternetReachable = netInfo.isInternetReachable ?? netInfo.isConnected;
  const isOffline = netInfo.isConnected === false || isInternetReachable === false;

  return {
    isOffline,
    isOnline: !isOffline,
    netInfo,
  };
}
