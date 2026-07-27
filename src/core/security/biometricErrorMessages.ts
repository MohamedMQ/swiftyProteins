import type { LocalAuthenticationError } from 'expo-local-authentication';

/**
 * User-facing text for every LocalAuthenticationError. Returns null for
 * cases the user caused on purpose (cancelling out of the prompt) — those
 * shouldn't surface as an "error" in the UI, just a silent return to the
 * password form.
 */
export function mapBiometricError(error: LocalAuthenticationError): string | null {
  switch (error) {
    case 'user_cancel':
    case 'user_fallback':
      return null;
    case 'app_cancel':
    case 'system_cancel':
      return 'Authentication was interrupted. Please try again.';
    case 'not_enrolled':
      return 'No biometrics are set up on this device. Use your password to log in.';
    case 'not_available':
      return "Biometric authentication isn't available on this device.";
    case 'passcode_not_set':
      return 'Set a device passcode to enable biometric login.';
    case 'lockout':
      return 'Too many failed attempts. Try again later or use your password.';
    case 'timeout':
      return 'Authentication timed out. Please try again.';
    case 'unable_to_process':
      return "Couldn't read your biometric data. Please try again.";
    case 'no_space':
      return 'Not enough storage on this device to complete authentication.';
    case 'invalid_context':
    case 'unknown':
    case 'authentication_failed':
    default:
      return 'Authentication failed. Please try again.';
  }
}
