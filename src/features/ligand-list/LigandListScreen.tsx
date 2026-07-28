import { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDebouncedValue } from '../../core/hooks/useDebouncedValue';
import { filterLigandCodes } from '../../core/persistence/ligandRepository';
import { theme } from '../../design-system';
import { LIGAND_ROW_HEIGHT, LigandRow } from './LigandRow';

const SEARCH_DEBOUNCE_MS = 150;

function keyExtractor(code: string): string {
  return code;
}

function getItemLayout(_: ArrayLike<string> | null | undefined, index: number) {
  return { length: LIGAND_ROW_HEIGHT, offset: LIGAND_ROW_HEIGHT * index, index };
}

interface LigandListScreenProps {
  codes: string[];
  onSelectLigand?: (code: string) => void;
}

export function LigandListScreen({ codes, onSelectLigand }: LigandListScreenProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const filteredCodes = useMemo(
    () => filterLigandCodes(codes, debouncedQuery),
    [codes, debouncedQuery]
  );
  const trimmedQuery = debouncedQuery.trim();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => <LigandRow code={item} onPress={onSelectLigand} />,
    [onSelectLigand]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header} accessibilityRole="header">
        Ligands
      </Text>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon} importantForAccessibility="no">
          ⌕
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${codes.length.toLocaleString()} ligands`}
          placeholderTextColor={theme.colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search ligands"
          accessibilityHint="Filters the ligand list as you type"
        />
      </View>

      <FlatList
        data={filteredCodes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={10}
        removeClippedSubviews
        contentContainerStyle={filteredCodes.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState} accessible accessibilityRole="text">
            <Text style={styles.emptyTitle}>
              {trimmedQuery.length > 0 ? `No ligands match "${trimmedQuery}"` : 'No ligands available'}
            </Text>
            {trimmedQuery.length > 0 && (
              <Text style={styles.emptySubtitle}>Try a different search term.</Text>
            )}
          </View>
        }
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md - 2,
    paddingVertical: theme.spacing.sm - 2,
  },
  searchIcon: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textTertiary,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
