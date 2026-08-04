/** In CIF, `?` means "unknown" and `.` means "not applicable" — both mean missing here. */
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

/** Element symbols come from the source data as e.g. "FE", "CL" — normalize to "Fe", "Cl". */
export function normalizeElementSymbol(typeSymbol: string | undefined): string {
  if (typeSymbol === undefined || typeSymbol.length === 0) {
    return '';
  }
  return typeSymbol.charAt(0).toUpperCase() + typeSymbol.slice(1).toLowerCase();
}
