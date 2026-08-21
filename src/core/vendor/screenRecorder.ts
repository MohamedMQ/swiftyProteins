import Constants, { AppOwnership } from 'expo-constants';
import { Platform } from 'react-native';
import type * as ScreenRecorderModule from 'react-native-nitro-screen-recorder';

export type { ScreenRecordingFile } from 'react-native-nitro-screen-recorder';

let cachedModule: typeof ScreenRecorderModule | null | undefined;

export function getScreenRecorder(): typeof ScreenRecorderModule | null {
  if (cachedModule === undefined) {
    cachedModule = loadModule();
  }
  return cachedModule;
}

function loadModule(): typeof ScreenRecorderModule | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  if (Constants.appOwnership === AppOwnership.Expo) {
    return null;
  }
  try {
    return require('react-native-nitro-screen-recorder') as typeof ScreenRecorderModule;
  } catch {
    return null;
  }
}
