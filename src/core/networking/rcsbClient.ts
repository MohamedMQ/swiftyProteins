const RCSB_LIGAND_BASE_URL = 'https://files.rcsb.org/ligands/view';
const REQUEST_TIMEOUT_MS = 15_000;

export class LigandRequestTimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'LigandRequestTimeoutError';
  }
}

/**
 * Raw transport only — returns whatever Response comes back (any HTTP
 * status) so status-code handling stays a separate concern. Both the
 * timeout and an external cancellation (e.g. the user navigating away)
 * abort the same underlying fetch, but a timeout is re-thrown as a
 * distinct error type so callers can tell "timed out" apart from "the
 * caller cancelled us on purpose" without racing flags.
 */
export async function fetchLigandCifResponse(
  code: string,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort);

  try {
    return await fetch(`${RCSB_LIGAND_BASE_URL}/${encodeURIComponent(code)}.cif`, {
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new LigandRequestTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
