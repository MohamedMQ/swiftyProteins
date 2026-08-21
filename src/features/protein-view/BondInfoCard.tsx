import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '../../design-system';
import { bondOrderLabel, formatBondLength } from './AtomInfoCard';

export interface BondInfo {
  elementA: string;
  elementB: string;
  order: number;
  length: number;
}

interface BondInfoCardProps {
  bond: BondInfo;
  onDismiss: () => void;
}

export function BondInfoCard({ bond, onDismiss }: BondInfoCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const orderLabel = bondOrderLabel(bond.order);
  const lengthLabel = formatBondLength(bond.length);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={styles.card}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${bond.elementA}–${bond.elementB} bond. ${orderLabel} bond, ${lengthLabel}.`}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {bond.elementA}–{bond.elementB} bond
          </Text>
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close bond details"
          >
            <Ionicons name="close" size={16} color={theme.colors.textTertiary} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Type</Text>
          <Text style={styles.rowValue}>{orderLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Length</Text>
          <Text style={styles.rowValue}>{lengthLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: theme.spacing.lg,
    },
    card: {
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: theme.fontSize.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    closeButton: {
      padding: 2,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontSize: theme.fontSize.caption,
      color: theme.colors.textTertiary,
    },
    rowValue: {
      fontSize: theme.fontSize.caption,
      color: theme.colors.textSecondary,
    },
  });
}
