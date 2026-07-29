import NetInfo from '@react-native-community/netinfo';

/**
 * isInternetReachable can be `null` (still being determined) — only treat
 * a definite `false` from either field as offline, so an unknown state
 * doesn't block a request that might actually succeed.
 */
export async function isOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === false || state.isInternetReachable === false;
}
