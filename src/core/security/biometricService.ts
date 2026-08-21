import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  return { hasHardware, isEnrolled, types };
}

export function isBiometricLoginAvailable(capability: BiometricCapability): boolean {
  return capability.hasHardware && capability.isEnrolled;
}

export function getBiometricButtonLabel(types: LocalAuthentication.AuthenticationType[]): string {
  const isIOS = Platform.OS === 'ios';

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return isIOS ? 'Use Touch ID' : 'Use fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return isIOS ? 'Use Face ID' : 'Use face unlock';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Use iris scan';
  }
  return 'Use biometrics';
}

export async function authenticateWithBiometrics(
  promptMessage = 'Log in to Swifty Protein'
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: true,
    fallbackLabel: '',
    cancelLabel: 'Use password',
  });
}
