import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '../../design-system';

const DOT_COUNT = 3;
const PULSE_DURATION_MS = 450;

export function SplashScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dotOpacities = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    const loops = dotOpacities.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * PULSE_DURATION_MS),
          Animated.timing(value, {
            toValue: 1,
            duration: PULSE_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: PULSE_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.delay((DOT_COUNT - 1 - index) * PULSE_DURATION_MS),
        ])
      )
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dotOpacities]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/splash-icon.png')}
        style={styles.mark}
        resizeMode="contain"
      />
      <Text style={styles.title}>Swifty Protein</Text>
      <Text style={styles.subtitle}>Ligand explorer</Text>
      <View style={styles.dots}>
        {dotOpacities.map((opacity, index) => (
          <Animated.View key={index} style={[styles.dot, { opacity }]} />
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    mark: {
      width: 96,
      height: 96,
    },
    title: {
      marginTop: theme.spacing.lg,
      fontSize: theme.fontSize.display,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: theme.spacing.xs,
      fontSize: theme.fontSize.subtitle,
      color: theme.colors.textQuaternary,
    },
    dots: {
      flexDirection: 'row',
      gap: theme.spacing.xs + 1,
      marginTop: theme.spacing.xxl + 2,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.colors.accent,
    },
  });
}
