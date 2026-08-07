import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../design-system';
import { VISUALIZATION_MODES, type VisualizationMode } from './proteinViewerHtml';

interface VisualizationModeSwitcherProps {
  mode: VisualizationMode;
  onChange: (mode: VisualizationMode) => void;
}

const MODE_LABELS: Record<VisualizationMode, string> = {
  ballAndStick: 'Ball & Stick',
  spaceFilling: 'Space-Filling',
  wireframe: 'Wireframe',
  stick: 'Stick',
};

export function VisualizationModeSwitcher({ mode, onChange }: VisualizationModeSwitcherProps) {
  return (
    <View style={styles.wrapper} accessibilityRole="tablist">
      {VISUALIZATION_MODES.map((candidate) => {
        const isSelected = candidate === mode;
        return (
          <Pressable
            key={candidate}
            onPress={() => onChange(candidate)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${MODE_LABELS[candidate]} visualization mode`}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{MODE_LABELS[candidate]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.medium,
  },
  labelSelected: {
    color: theme.colors.onAccent,
  },
});
