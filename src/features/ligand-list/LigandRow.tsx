import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAvatarColor, theme } from '../../design-system';

interface LigandRowProps {
  code: string;
  onPress?: () => void;
}

function LigandRowComponent({ code, onPress }: LigandRowProps) {
  const avatar = getAvatarColor(code);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ligand ${code}`}
    >
      <View style={[styles.avatar, { backgroundColor: avatar.background }]}>
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
    width: 32,
    height: 32,
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
