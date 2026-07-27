import * as LocalAuthentication from 'expo-local-authentication';

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
