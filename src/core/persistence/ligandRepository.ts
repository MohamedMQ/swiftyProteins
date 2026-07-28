import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import ligandsListAsset from '../../../assets/data/ligands.txt';

/**
 * Parses the bundled ligands.txt format: one code per line. Trims whitespace,
 * drops empty lines, removes duplicates, and returns the codes sorted.
 */
export function parseLigandCodes(raw: string): string[] {
  const codes = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const code = line.trim();
    if (code.length > 0) {
      codes.add(code);
    }
  }

  return Array.from(codes).sort((a, b) => a.localeCompare(b));
}

export function filterLigandCodes(codes: string[], query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return codes;
  }

  return codes.filter((code) => code.toLowerCase().includes(normalizedQuery));
}

export async function loadLigandCodes(): Promise<string[]> {
  const asset = Asset.fromModule(ligandsListAsset);
  await asset.downloadAsync();

  const uri = asset.localUri ?? asset.uri;
  const raw = await new File(uri).text();

  return parseLigandCodes(raw);
}
