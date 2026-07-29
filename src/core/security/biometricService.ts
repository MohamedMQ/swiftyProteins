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

/**
 * supportedAuthenticationTypesAsync() reports hardware *capability*, not
 * which modality is actually enrolled — plenty of Android devices report
 * both fingerprint and facial recognition as supported even when only a
 * fingerprint is set up. Fingerprint is checked first since it's the far
 * more common actually-enrolled modality on Android; devices with only
 * Face ID (e.g. modern iPhones, which have no fingerprint sensor at all)
 * still fall through to it correctly.
 */
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

/**
 * disableDeviceFallback/fallbackLabel keep the OS from offering its own
 * "enter device passcode" path: the app already has its own password form
 * as the fallback, and stacking a second unrelated fallback on top of it
 * would just be confusing.
 */
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
