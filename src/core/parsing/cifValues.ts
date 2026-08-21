export function isMissingCifValue(value: string | undefined): boolean {
  return value === undefined || value === '?' || value === '.';
}

export function parseCifCoordinate(value: string | undefined): number | null {
  if (isMissingCifValue(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeElementSymbol(typeSymbol: string | undefined): string {
  if (typeSymbol === undefined || typeSymbol.length === 0) {
    return '';
  }
  return typeSymbol.charAt(0).toUpperCase() + typeSymbol.slice(1).toLowerCase();
}
