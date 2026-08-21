const RCSB_LIGAND_BASE_URL = 'https://files.rcsb.org/ligands/view';
const REQUEST_TIMEOUT_MS = 15_000;

export class LigandRequestTimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'LigandRequestTimeoutError';
  }
}

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
