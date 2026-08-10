import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDebouncedValue } from '../../core/hooks/useDebouncedValue';
import {
  getLigandFetchErrorIcon,
  getLigandFetchErrorMessage,
  getLigandFetchErrorTitle,
  type LigandFetchError,
} from '../../core/networking/ligandFetchError';
import { fetchLigandCif } from '../../core/networking/ligandService';
import { loadFavoriteCodes, saveFavoriteCodes } from '../../core/persistence/favoritesRepository';
import { applyFavoritesFilter, filterLigandCodes } from '../../core/persistence/ligandRepository';
import { AlertCard, theme } from '../../design-system';
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
  onOpenSettings: () => void;
}

export function LigandListScreen({ codes, onLigandLoaded, onOpenSettings }: LigandListScreenProps) {
  const [query, setQuery] = useState('');
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<{ code: string; error: LigandFetchError } | null>(
    null
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const filteredCodes = useMemo(
    () => applyFavoritesFilter(filterLigandCodes(codes, debouncedQuery), favorites, showFavoritesOnly),
    [codes, debouncedQuery, favorites, showFavoritesOnly]
  );
  const trimmedQuery = debouncedQuery.trim();

  useEffect(() => {
    let cancelled = false;
    loadFavoriteCodes().then((loaded) => {
      if (!cancelled) {
        setFavorites(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFavorite = useCallback((code: string) => {
    setFavorites((previous) => {
      const next = new Set(previous);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      saveFavoriteCodes(next);
      return next;
    });
  }, []);

  const handleSelectLigand = useCallback(
    async (code: string) => {
      if (loadingCode !== null) {
        return;
      }

      setFetchError(null);
      setLoadingCode(code);
      const result = await fetchLigandCif(code);
      setLoadingCode(null);

      if (result.success) {
        onLigandLoaded(code, result.raw);
      } else {
        setFetchError({ code, error: result.error });
      }
    },
    [loadingCode, onLigandLoaded]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <LigandRow
        code={item}
        isFavorite={favorites.has(item)}
        onPress={handleSelectLigand}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [handleSelectLigand, handleToggleFavorite, favorites]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.header} accessibilityRole="header">
          Ligands
        </Text>
        <Pressable
          onPress={onOpenSettings}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
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
        <Pressable
          onPress={() => setShowFavoritesOnly((previous) => !previous)}
          style={styles.favoritesToggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: showFavoritesOnly }}
          accessibilityLabel="Show favorites only"
        >
          <Ionicons
            name={showFavoritesOnly ? 'star' : 'star-outline'}
            size={20}
            color={showFavoritesOnly ? theme.colors.accent : theme.colors.textSecondary}
          />
        </Pressable>
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
                {showFavoritesOnly && trimmedQuery.length === 0
                  ? 'No favorites yet'
                  : trimmedQuery.length > 0
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

        {fetchError !== null && (
          <AlertCard
            iconName={getLigandFetchErrorIcon(fetchError.error)}
            title={getLigandFetchErrorTitle(fetchError.error)}
            message={getLigandFetchErrorMessage(fetchError.error)}
            onDismiss={() => setFetchError(null)}
            onRetry={() => {
              const code = fetchError.code;
              setFetchError(null);
              handleSelectLigand(code);
            }}
          />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  header: {
    fontSize: theme.fontSize.heading,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  favoritesToggle: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
