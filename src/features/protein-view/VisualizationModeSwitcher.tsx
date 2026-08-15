import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function VisualizationModeSwitcher({ mode, onChange }: VisualizationModeSwitcherProps) {
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null);

  function handleOpen() {
    // Measured on open (rather than kept in state via onLayout) so the
    // dropdown always anchors to the trigger's current on-screen position,
    // even if the surrounding layout shifted since the last render.
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
    });
  }

  function handleSelect(candidate: VisualizationMode) {
    setOpen(false);
    onChange(candidate);
  }

  return (
    <View style={styles.wrapper} ref={triggerRef}>
      <Pressable
        onPress={handleOpen}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Choose visualization mode"
      >
        <Text style={styles.triggerLabel}>{MODE_LABELS[mode]}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {triggerLayout && (
            <View
              style={[
                styles.dropdown,
                {
                  top: triggerLayout.y + triggerLayout.height + theme.spacing.xs,
                  left: triggerLayout.x,
                  width: triggerLayout.width,
                },
              ]}
              accessibilityRole="menu"
            >
              {VISUALIZATION_MODES.map((candidate) => {
                const isSelected = candidate === mode;
                return (
                  <Pressable
                    key={candidate}
                    onPress={() => handleSelect(candidate)}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${MODE_LABELS[candidate]} visualization mode`}
                  >
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {MODE_LABELS[candidate]}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={theme.colors.accent} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  triggerLabel: {
    fontSize: theme.fontSize.caption,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  backdrop: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  optionSelected: {
    backgroundColor: theme.colors.background,
  },
  optionLabel: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
  },
  optionLabelSelected: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.medium,
  },
});
