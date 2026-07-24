import { FlatList, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../design-system';

interface LigandListScreenProps {
  codes: string[];
}

export function LigandListScreen({ codes }: LigandListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ligands</Text>
      <FlatList
        data={codes}
        keyExtractor={(code) => code}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.code}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xxl,
  },
  header: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  row: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  code: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
});
