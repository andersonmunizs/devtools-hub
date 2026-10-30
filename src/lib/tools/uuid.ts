import type { ToolResult } from '../../types/tool-result';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';

export function parseUuidCount(input: string): ToolResult<number> {
  const bytes = getTextInputSize(input);
  if (bytes === null || bytes > TEXT_INPUT_LIMIT_BYTES) {
    return {
      ok: false,
      code: 'INPUT_TOO_LARGE',
      message:
        'A entrada excede 1 MiB. Informe uma quantidade inteira de 1 a 20.',
    };
  }
  const match = /^(?:[1-9]|1[0-9]|20)$/.exec(input);
  if (!match || match[0] !== input) {
    return {
      ok: false,
      code: 'INVALID_COUNT',
      message:
        'Informe um inteiro de 1 a 20, sem espaços, sinais, zeros à esquerda ou casas decimais.',
    };
  }
  return { ok: true, value: Number(input) };
}

export function generateUuids(
  input: string,
  randomUuid: () => string,
): ToolResult<readonly string[]> {
  const count = parseUuidCount(input);
  if (!count.ok) return count;
  try {
    const values: string[] = [];
    for (let index = 0; index < count.value; index += 1)
      values.push(randomUuid());
    return { ok: true, value: values };
  } catch {
    return {
      ok: false,
      code: 'GENERATION_FAILED',
      message:
        'Não foi possível gerar UUIDs com Web Crypto. Nenhuma lista parcial foi disponibilizada. Tente novamente.',
    };
  }
}

export function browserUuidAvailable(): boolean {
  return (
    globalThis.isSecureContext === true &&
    typeof globalThis.crypto?.randomUUID === 'function'
  );
}

export function generateBrowserUuids(
  input: string,
): ToolResult<readonly string[]> {
  if (!browserUuidAvailable()) {
    return {
      ok: false,
      code: 'UNSUPPORTED_API',
      message:
        'Geração indisponível: é necessário um contexto seguro (HTTPS ou localhost confiável) e um navegador com crypto.randomUUID(). Não há gerador alternativo.',
    };
  }
  return generateUuids(input, () => globalThis.crypto.randomUUID());
}
