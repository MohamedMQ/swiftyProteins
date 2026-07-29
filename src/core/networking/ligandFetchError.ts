export type LigandFetchError =
  | { type: 'noConnection' }
  | { type: 'notFound' }
  | { type: 'timeout' }
  | { type: 'parseFailure' }
  | { type: 'serverError'; status: number };

/** Exact copy matches the subject's required message strings. */
export function getLigandFetchErrorMessage(error: LigandFetchError): string {
  switch (error.type) {
    case 'noConnection':
      return 'No internet connection. Please check your network.';
    case 'notFound':
      return 'Ligand not found (404). This ligand may not exist in the database.';
    case 'parseFailure':
      return 'Failed to parse ligand data. The file may be corrupted.';
    case 'timeout':
      return 'Request timeout. Please try again.';
    case 'serverError':
      return `Server error (${error.status}). Please try again later.`;
  }
}
