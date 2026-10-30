import type { ToolResult } from '../../types/tool-result';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';
import { hasIsolatedSurrogate } from '../unicode';

const encoder = new TextEncoder();
const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const invalidBase64 = (): ToolResult<string> => ({
  ok: false,
  code: 'INVALID_BASE64',
  message:
    'Base64 inválido. Use o alfabeto padrão (+ e /), padding = quando necessário e nenhum espaço ou quebra de linha. Base64URL não é aceito.',
});

function inputTooLarge(input: string): boolean {
  const bytes = getTextInputSize(input);
  return bytes === null || bytes > TEXT_INPUT_LIMIT_BYTES;
}
const sizeError = (): ToolResult<string> => ({
  ok: false,
  code: 'INPUT_TOO_LARGE',
  message:
    'A entrada excede 1 MiB (1.048.576 bytes UTF-8). Reduza o texto antes de processar.',
});

export function encodeBase64(input: string): ToolResult<string> {
  if (inputTooLarge(input)) return sizeError();
  if (hasIsolatedSurrogate(input))
    return {
      ok: false,
      code: 'INVALID_UNICODE',
      message:
        'O texto contém um surrogate Unicode isolado. Corrija essa sequência antes de codificar; ela não será substituída silenciosamente.',
    };
  try {
    const bytes = encoder.encode(input);
    const chunks: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 16_384) {
      chunks.push(
        String.fromCharCode(...bytes.subarray(offset, offset + 16_384)),
      );
    }
    return { ok: true, value: btoa(chunks.join('')) };
  } catch {
    return {
      ok: false,
      code: 'PROCESSING_LIMIT',
      message:
        'Não foi possível codificar neste navegador. Reduza o texto e tente novamente.',
    };
  }
}

export function decodeBase64(input: string): ToolResult<string> {
  if (inputTooLarge(input)) return sizeError();
  if (input.length % 4 !== 0) return invalidBase64();
  const padding = input.endsWith('==') ? 2 : input.endsWith('=') ? 1 : 0;
  const contentLength = input.length - padding;
  // Linear validation avoids a repeated regex over a potentially 1 MiB input.
  for (let i = 0; i < contentLength; i += 1) {
    const c = input.charCodeAt(i);
    if (!(
      (c >= 65 && c <= 90) ||
      (c >= 97 && c <= 122) ||
      (c >= 48 && c <= 57) ||
      c === 43 ||
      c === 47
    ))
      return invalidBase64();
  }
  if (padding > 0) {
    const sextet = alphabet.indexOf(input.charAt(contentLength - 1));
    if (sextet < 0 || (sextet & (padding === 2 ? 15 : 3)) !== 0)
      return invalidBase64();
  }
  let bytes: Uint8Array;
  try {
    const binary = atob(input);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  } catch {
    return invalidBase64();
  }
  try {
    // Preserve a leading U+FEFF; fatal decoding never substitutes invalid UTF-8.
    return {
      ok: true,
      value: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
        bytes,
      ),
    };
  } catch {
    return {
      ok: false,
      code: 'INVALID_UTF8',
      message:
        'O Base64 é válido, mas os bytes não representam texto UTF-8 válido. Esta ferramenta não converte arquivos binários nem substitui bytes inválidos.',
    };
  }
}
