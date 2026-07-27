import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';

/**
 * Always-mounted cover, independent of useAppLock's isLocked (which stays
 * true even while the login screen itself is active in the foreground).
 * This only reacts to leaving 'active', so the OS app-switcher snapshot
 * never shows whatever was on screen the instant the app backgrounds —
 * before React has even had a chance to swap in the login screen.
 *
 * Android has no reliable native blur without opting into a heavier,
 * slower method, so the opaque backgroundColor is the real guarantee there;
 * the BlurView gives a frosted look for free on iOS.
 */
export function PrivacyOverlay() {
  const [visible, setVisible] = useState(AppState.currentState !== 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setVisible(nextState !== 'active');
    });
    return () => subscription.remove();
  }, []);

  if (!visible) {
    return null;
  }

  return <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, styles.overlay]} />;
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(14, 17, 22, 0.92)',
  },
});
