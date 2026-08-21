import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Line, Svg } from 'react-native-svg';

import { getMoleculeGlyph, MOLECULE_GLYPH_BOND_COLOR, PrimaryButton, useTheme, type Theme } from '../../design-system';

interface OnboardingSlide {
  glyphSeed: string;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    glyphSeed: 'GLC',
    title: 'Browse and favorite ligands',
    description: 'Search the full RCSB ligand list and star the ones you come back to often.',
  },
  {
    glyphSeed: 'HEM',
    title: 'Explore in full 3D',
    description:
      'Rotate, zoom, and switch between ball-and-stick, space-filling, wireframe, and stick models.',
  },
  {
    glyphSeed: 'ATP',
    title: 'Measure, label, and share',
    description: 'Tap atoms for details, measure distances between them, and share a snapshot.',
  },
];

const GLYPH_DISPLAY_SIZE = 120;

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const width = Dimensions.get('window').width;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  function handleNext() {
    if (isLastSlide) {
      onComplete();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }

  const renderSlide = ({ item }: ListRenderItemInfo<OnboardingSlide>) => {
    const glyph = getMoleculeGlyph(item.glyphSeed);
    const scale = GLYPH_DISPLAY_SIZE / glyph.size;

    return (
      <View style={styles.slide}>
        <Svg width={GLYPH_DISPLAY_SIZE} height={GLYPH_DISPLAY_SIZE} viewBox={`0 0 ${glyph.size} ${glyph.size}`}>
          {glyph.bonds.map((bond, index) => (
            <Line
              key={index}
              x1={bond.x1}
              y1={bond.y1}
              x2={bond.x2}
              y2={bond.y2}
              stroke={MOLECULE_GLYPH_BOND_COLOR}
              strokeWidth={2 / scale}
              strokeLinecap="round"
            />
          ))}
          {glyph.satellites.map((node, index) => (
            <Circle key={index} cx={node.x} cy={node.y} r={node.radius} fill={node.color} />
          ))}
          <Circle cx={glyph.hub.x} cy={glyph.hub.y} r={glyph.hub.radius} fill={glyph.hub.color} />
        </Svg>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {!isLastSlide && (
        <Pressable onPress={onComplete} hitSlop={8} style={styles.skip} accessibilityRole="button">
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      )}

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(slide) => slide.glyphSeed}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.list}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, index) => (
          <View key={slide.glyphSeed} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={isLastSlide ? 'Get Started' : 'Next'} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  const slideWidth = Dimensions.get('window').width;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    skip: {
      alignSelf: 'flex-end',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
    },
    skipLabel: {
      fontSize: theme.fontSize.body,
      color: theme.colors.textTertiary,
    },
    list: {
      flex: 1,
    },
    slide: {
      width: slideWidth,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
    },
    slideTitle: {
      marginTop: theme.spacing.xl,
      fontSize: theme.fontSize.title,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    slideDescription: {
      marginTop: theme.spacing.sm,
      fontSize: theme.fontSize.body,
      color: theme.colors.textQuaternary,
      textAlign: 'center',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.lg,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
    },
    dotActive: {
      backgroundColor: theme.colors.accent,
    },
    footer: {
      padding: theme.spacing.xl,
    },
  });
}
