import { FlatList, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../design-system';
import { LigandRow } from './LigandRow';

interface LigandListScreenProps {
  codes: string[];
  onSelectLigand?: (code: string) => void;
}

export function LigandListScreen({ codes, onSelectLigand }: LigandListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ligands</Text>
      <FlatList
        data={codes}
        keyExtractor={(code) => code}
        renderItem={({ item }) => (
          <LigandRow code={item} onPress={onSelectLigand ? () => onSelectLigand(item) : undefined} />
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
});
