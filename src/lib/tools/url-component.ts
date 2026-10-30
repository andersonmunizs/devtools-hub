import type { ToolResult } from '../../types/tool-result';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';

function convert(
  input: string,
  direction: 'encode' | 'decode',
): ToolResult<string> {
  const bytes = getTextInputSize(input);
  if (bytes === null || bytes > TEXT_INPUT_LIMIT_BYTES) {
    return {
      ok: false,
      code: 'INPUT_TOO_LARGE',
      message:
        'A entrada excede 1 MiB (1.048.576 bytes UTF-8). Reduza o texto antes de processar.',
    };
  }
  try {
    return {
      ok: true,
      value:
        direction === 'encode'
          ? encodeURIComponent(input)
          : decodeURIComponent(input),
    };
  } catch (error: unknown) {
    if (error instanceof URIError) {
      return direction === 'encode'
        ? {
            ok: false,
            code: 'INVALID_UNICODE',
            message:
              'O texto contém um surrogate Unicode isolado. Corrija essa sequência antes de codificar; ela não será substituída silenciosamente.',
          }
        : {
            ok: false,
            code: 'INVALID_COMPONENT',
            message:
              'Componente inválido. Cada % precisa de dois dígitos hexadecimais e as sequências percentuais devem representar UTF-8 válido.',
          };
    }
    return {
      ok: false,
      code: 'PROCESSING_LIMIT',
      message:
        'Não foi possível converter neste navegador. Reduza o texto e tente novamente.',
    };
  }
}

export function encodeUrlComponent(input: string): ToolResult<string> {
  return convert(input, 'encode');
}

export function decodeUrlComponent(input: string): ToolResult<string> {
  return convert(input, 'decode');
}
