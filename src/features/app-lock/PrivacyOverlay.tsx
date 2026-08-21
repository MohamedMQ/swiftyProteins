import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';

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
