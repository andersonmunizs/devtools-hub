import type { ToolResult } from '../../types/tool-result';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';
import { hasIsolatedSurrogate } from '../unicode';

export const HASH_UNAVAILABLE_MESSAGE =
  'SHA-256 indisponível: use um contexto seguro (HTTPS ou localhost confiável) e um navegador com crypto.subtle.digest(). Não há cálculo alternativo.';

export function browserHashAvailable(): boolean {
  return (
    globalThis.isSecureContext === true &&
    typeof globalThis.crypto?.subtle?.digest === 'function'
  );
}

export async function sha256(input: string): Promise<ToolResult<string>> {
  const bytes = getTextInputSize(input);
  if (bytes === null || bytes > TEXT_INPUT_LIMIT_BYTES) {
    return {
      ok: false,
      code: 'INPUT_TOO_LARGE',
      message:
        'A entrada excede 1 MiB (1.048.576 bytes UTF-8). Reduza o texto antes de processar.',
    };
  }
  if (hasIsolatedSurrogate(input)) {
    return {
      ok: false,
      code: 'INVALID_UNICODE',
      message:
        'O texto contém um surrogate Unicode isolado. Corrija essa sequência antes de calcular; ela não será substituída silenciosamente.',
    };
  }
  if (!browserHashAvailable())
    return {
      ok: false,
      code: 'UNSUPPORTED_API',
      message: HASH_UNAVAILABLE_MESSAGE,
    };
  try {
    const encoded = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    const value = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    return { ok: true, value };
  } catch {
    return {
      ok: false,
      code: 'HASH_FAILED',
      message:
        'Não foi possível calcular SHA-256 com Web Crypto. Nenhum resultado parcial foi disponibilizado. Tente novamente.',
    };
  }
}
