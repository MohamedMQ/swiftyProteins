import { StyleSheet, Text, View } from 'react-native';

import { getElementInfo } from '../../core/chemistry/elementInfo';
import { theme } from '../../design-system';

export interface BondDetail {
  element: string;
  order: number;
  length: number;
}

export interface AtomInfo {
  element: string;
  x: number;
  y: number;
  z: number;
  bondOrders: number[];
  bonds?: BondDetail[];
}

interface AtomInfoCardProps {
  atom: AtomInfo;
}

const BOND_ORDER_LABELS: Record<number, string> = { 1: 'single', 2: 'double', 3: 'triple' };

export function bondOrderLabel(order: number): string {
  return BOND_ORDER_LABELS[order] ?? 'unknown';
}

export function summarizeBonds(bondOrders: number[]): string {
  if (bondOrders.length === 0) {
    return 'None';
  }

  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const order of bondOrders) {
    if (order === 1 || order === 2 || order === 3) {
      counts[order] += 1;
    }
  }

  const labels: [number, string][] = [
    [counts[1], 'single'],
    [counts[2], 'double'],
    [counts[3], 'triple'],
  ];

  return labels
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(', ');
}

export function formatBondLength(length: number): string {
  return `${length.toFixed(2)} Å`;
}

function formatCoordinate(value: number): string {
  return value.toFixed(1);
}

export function AtomInfoCard({ atom }: AtomInfoCardProps) {
  const info = getElementInfo(atom.element);
  const position = `${formatCoordinate(atom.x)}, ${formatCoordinate(atom.y)}, ${formatCoordinate(atom.z)}`;
  const bonds = summarizeBonds(atom.bondOrders);
  const bondDetailsText = (atom.bonds ?? [])
    .map((bond) => `${bond.element} ${bondOrderLabel(bond.order)} bond, ${formatBondLength(bond.length)}`)
    .join('. ');

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={styles.card}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${info.name}. Element ${atom.element}. Position ${position}. Bonds: ${bonds}.${
          bondDetailsText.length > 0 ? ` ${bondDetailsText}.` : ''
        }`}
      >
        <View style={styles.header}>
          <View style={[styles.dot, { backgroundColor: info.color }]} />
          <Text style={styles.name}>{info.name}</Text>
          <Text style={styles.symbol}>{atom.element}</Text>
        </View>
        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Element</Text>
            <Text style={styles.rowValue}>
              {atom.element} · {info.atomicNumber}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Position</Text>
            <Text style={styles.rowValue}>{position}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Bonds</Text>
            <Text style={styles.rowValue}>{bonds}</Text>
          </View>
        </View>
        {atom.bonds !== undefined && atom.bonds.length > 0 && (
          <View style={styles.bondList}>
            {atom.bonds.map((bond, index) => (
              <View key={index} style={styles.bondRow}>
                <Text style={styles.bondText}>
                  {bond.element} · {bondOrderLabel(bond.order)}
                </Text>
                <Text style={styles.bondText}>{formatBondLength(bond.length)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  name: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  symbol: {
    marginLeft: 'auto',
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
  },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.xs + 2,
    gap: theme.spacing.xs,
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
  bondList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.xs + 2,
    paddingTop: theme.spacing.xs + 2,
    gap: theme.spacing.xs,
  },
  bondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bondText: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
  },
});
