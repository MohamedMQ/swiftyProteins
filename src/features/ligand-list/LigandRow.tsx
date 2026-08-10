import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Circle, Line, Svg } from 'react-native-svg';

import { getMoleculeGlyph, MOLECULE_GLYPH_BOND_COLOR, theme } from '../../design-system';

interface LigandRowProps {
  code: string;
  isFavorite?: boolean;
  onPress?: (code: string) => void;
  onToggleFavorite?: (code: string) => void;
}

const AVATAR_SIZE = 36;

// Single source of truth for the row's fixed height, so FlatList's
// getItemLayout (scroll perf) can never drift out of sync with the actual
// rendered row.
export const LIGAND_ROW_HEIGHT =
  AVATAR_SIZE + theme.spacing.md * 2 + StyleSheet.hairlineWidth;

function LigandRowComponent({ code, isFavorite = false, onPress, onToggleFavorite }: LigandRowProps) {
  const glyph = useMemo(() => getMoleculeGlyph(code), [code]);

  return (
    <Pressable
      onPress={onPress ? () => onPress(code) : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ligand ${code}`}
    >
      <Svg width={glyph.size} height={glyph.size} importantForAccessibility="no-hide-descendants">
        {glyph.bonds.map((bond, index) => (
          <Line
            key={index}
            x1={bond.x1}
            y1={bond.y1}
            x2={bond.x2}
            y2={bond.y2}
            stroke={MOLECULE_GLYPH_BOND_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        {glyph.satellites.map((node, index) => (
          <Circle key={index} cx={node.x} cy={node.y} r={node.radius} fill={node.color} />
        ))}
        <Circle cx={glyph.hub.x} cy={glyph.hub.y} r={glyph.hub.radius} fill={glyph.hub.color} />
      </Svg>
      <Text style={styles.code}>{code}</Text>
      {onToggleFavorite && (
        <Pressable
          onPress={() => onToggleFavorite(code)}
          hitSlop={8}
          accessibilityRole="switch"
          accessibilityState={{ checked: isFavorite }}
          accessibilityLabel={isFavorite ? `Remove ${code} from favorites` : `Add ${code} to favorites`}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={isFavorite ? theme.colors.accent : theme.colors.textQuaternary}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

export const LigandRow = memo(LigandRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  rowPressed: {
    backgroundColor: theme.colors.surface,
  },
  code: {
    flex: 1,
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
});
