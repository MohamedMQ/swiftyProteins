import { getCachedLigandCif, setCachedLigandCif } from '../persistence/ligandCifCache';
import type { LigandFetchError } from './ligandFetchError';
import { isOffline } from './reachability';
import { fetchLigandCifResponse, LigandRequestTimeoutError } from './rcsbClient';

export type LigandFetchResult =
  | { success: true; raw: string }
  | { success: false; error: LigandFetchError };

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export async function fetchLigandCif(
  code: string,
  signal?: AbortSignal
): Promise<LigandFetchResult> {
  const cached = await getCachedLigandCif(code);
  if (cached !== null) {
    return { success: true, raw: cached };
  }

  if (await isOffline()) {
    return { success: false, error: { type: 'noConnection' } };
  }

  let response: Response;

  try {
    response = await fetchLigandCifResponse(code, signal);
  } catch (error) {
    if (error instanceof LigandRequestTimeoutError) {
      return { success: false, error: { type: 'timeout' } };
    }
    if (isAbortError(error)) {
      throw error;
    }
    return { success: false, error: { type: 'noConnection' } };
  }

  if (response.status === 404) {
    return { success: false, error: { type: 'notFound' } };
  }
  if (!response.ok) {
    return { success: false, error: { type: 'serverError', status: response.status } };
  }

  const raw = await response.text();
  setCachedLigandCif(code, raw);
  return { success: true, raw };
}
