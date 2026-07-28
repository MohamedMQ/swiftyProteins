import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAvatarColor, theme } from '../../design-system';

interface LigandRowProps {
  code: string;
  onPress?: (code: string) => void;
}

const AVATAR_SIZE = 32;

// Single source of truth for the row's fixed height, so FlatList's
// getItemLayout (scroll perf) can never drift out of sync with the actual
// rendered row.
export const LIGAND_ROW_HEIGHT =
  AVATAR_SIZE + theme.spacing.sm * 2 + StyleSheet.hairlineWidth;

function LigandRowComponent({ code, onPress }: LigandRowProps) {
  const avatar = getAvatarColor(code);

  return (
    <Pressable
      onPress={onPress ? () => onPress(code) : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ligand ${code}`}
    >
      <View
        style={[styles.avatar, { backgroundColor: avatar.background }]}
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={[styles.avatarText, { color: avatar.foreground }]}>
          {code.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.code}>{code}</Text>
    </Pressable>
  );
}

export const LigandRow = memo(LigandRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  rowPressed: {
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.sm - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.fontSize.caption,
    fontWeight: theme.fontWeight.medium,
  },
  code: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
});
