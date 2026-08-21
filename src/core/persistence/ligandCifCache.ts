import { Directory, File, Paths } from 'expo-file-system';

const CACHE_DIR = new Directory(Paths.cache, 'ligands');

function cacheFileFor(code: string): File {
  const safeCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return new File(CACHE_DIR, `${safeCode}.cif`);
}

export async function getCachedLigandCif(code: string): Promise<string | null> {
  const file = cacheFileFor(code);
  if (!file.exists) {
    return null;
  }
  return file.text();
}

export function setCachedLigandCif(code: string, raw: string): void {
  try {
    if (!CACHE_DIR.exists) {
      CACHE_DIR.create({ intermediates: true });
    }
    const file = cacheFileFor(code);
    file.create({ intermediates: true, overwrite: true });
    file.write(raw);
  } catch {
  }
}
