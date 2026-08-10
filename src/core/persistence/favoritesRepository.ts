import { File, Paths } from 'expo-file-system';

const FAVORITES_FILE = new File(Paths.document, 'favorites.json');

export function parseFavoritesJson(raw: string): Set<string> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
  } catch {
    return new Set();
  }
}

export async function loadFavoriteCodes(): Promise<Set<string>> {
  if (!FAVORITES_FILE.exists) {
    return new Set();
  }
  return parseFavoritesJson(await FAVORITES_FILE.text());
}

/**
 * Favorites are best-effort persistence — a write failure shouldn't break
 * the in-memory toggle the user just performed.
 */
export function saveFavoriteCodes(codes: ReadonlySet<string>): void {
  try {
    if (!FAVORITES_FILE.exists) {
      FAVORITES_FILE.create({ intermediates: true });
    }
    FAVORITES_FILE.write(JSON.stringify(Array.from(codes)));
  } catch {
    // Best-effort; a failed write just means favorites won't survive restart.
  }
}
