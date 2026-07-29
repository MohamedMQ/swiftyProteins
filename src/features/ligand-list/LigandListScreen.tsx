import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDebouncedValue } from '../../core/hooks/useDebouncedValue';
import { getLigandFetchErrorMessage } from '../../core/networking/ligandFetchError';
import { fetchLigandCif } from '../../core/networking/ligandService';
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
  onLigandLoaded: (code: string, raw: string) => void;
}

export function LigandListScreen({ codes, onLigandLoaded }: LigandListScreenProps) {
  const [query, setQuery] = useState('');
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const filteredCodes = useMemo(
    () => filterLigandCodes(codes, debouncedQuery),
    [codes, debouncedQuery]
  );
  const trimmedQuery = debouncedQuery.trim();

  const handleSelectLigand = useCallback(
    async (code: string) => {
      if (loadingCode !== null) {
        return;
      }

      setLoadingCode(code);
      const result = await fetchLigandCif(code);
      setLoadingCode(null);

      if (result.success) {
        onLigandLoaded(code, result.raw);
      } else {
        Alert.alert(`Couldn't load ${code}`, getLigandFetchErrorMessage(result.error));
      }
    },
    [loadingCode, onLigandLoaded]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <LigandRow code={item} onPress={handleSelectLigand} />
    ),
    [handleSelectLigand]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

      <View style={styles.listContainer}>
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
                {trimmedQuery.length > 0
                  ? `No ligands match "${trimmedQuery}"`
                  : 'No ligands available'}
              </Text>
              {trimmedQuery.length > 0 && (
                <Text style={styles.emptySubtitle}>Try a different search term.</Text>
              )}
            </View>
          }
        />

        {loadingCode !== null && (
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingTitle}>Fetching {loadingCode}.cif</Text>
            <Text style={styles.loadingSubtitle}>files.rcsb.org</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.lg,
  },
  header: {
    fontSize: theme.fontSize.heading,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
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
  listContainer: {
    flex: 1,
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
  loadingOverlay: {
    backgroundColor: 'rgba(10, 13, 17, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  loadingTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
  },
});
