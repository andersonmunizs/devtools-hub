import type { ToolResult } from '../../types/tool-result';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';

export const JSON_INPUT_LIMIT_BYTES = TEXT_INPUT_LIMIT_BYTES;
export const JSON_OUTPUT_LIMIT_BYTES = 8_388_608;
export type JsonMode = 'format' | 'minify' | 'validate';
const encoder = new TextEncoder();

export const getJsonInputSize = getTextInputSize;

class OutputLimitError extends Error {}
interface Ancestor {
  value: object;
  children: number;
}

/** Native stringify produces the output; the replacer only counts bytes and
 * returns values unchanged. All objects originate in JSON.parse, so there are
 * no accessors, executable toJSON methods, DOM objects or user callbacks. */
function stringifyWithinBudget(
  parsed: unknown,
  mode: JsonMode,
  indentation: number,
): string | undefined {
  const pretty = mode === 'format';
  const ancestors: Ancestor[] = [];
  let bytes = 0;
  const add = (amount: number) => {
    bytes += amount;
    if (bytes > JSON_OUTPUT_LIMIT_BYTES) throw new OutputLimitError();
  };
  return JSON.stringify(
    parsed,
    function (this: unknown, key: string, value: unknown): unknown {
      while (ancestors.length && ancestors.at(-1)?.value !== this)
        ancestors.pop();
      const parent = ancestors.at(-1);
      const depth = ancestors.length;
      if (parent) {
        if (parent.children > 0)
          add(1); // comma
        else if (pretty) add(1 + indentation * (depth - 1)); // parent's closing newline/indent
        if (pretty) add(1 + indentation * depth); // child's newline/indent
        if (!Array.isArray(parent.value))
          add(
            encoder.encode(JSON.stringify(key)).byteLength + (pretty ? 2 : 1),
          );
        parent.children += 1;
      }
      if (typeof value === 'object' && value !== null) {
        add(2); // opening and closing braces/brackets
        ancestors.push({ value, children: 0 });
      } else {
        const literal = JSON.stringify(value);
        if (literal === undefined)
          throw new TypeError('Unsupported parsed JSON value');
        // Number/boolean/null literals contain only ASCII. Avoid allocating a
        // UTF-8 buffer for every element of a large numeric array.
        add(
          typeof value === 'string'
            ? encoder.encode(literal).byteLength
            : literal.length,
        );
      }
      return value;
    },
    pretty ? indentation : undefined,
  );
}

export function transformJson(
  input: string,
  mode: JsonMode,
  indentation: 2 | 3 | 4 = 2,
): ToolResult<string> {
  const bytes = getJsonInputSize(input);
  if (bytes === null || bytes > JSON_INPUT_LIMIT_BYTES)
    return {
      ok: false,
      code: 'INPUT_TOO_LARGE',
      message:
        'A entrada excede 1 MiB (1.048.576 bytes UTF-8). Reduza o texto antes de processar.',
    };
  if (!input.trim())
    return {
      ok: false,
      code: 'EMPTY_INPUT',
      message: 'Insira um JSON ou use o exemplo sintético para começar.',
    };
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error: unknown) {
    return error instanceof SyntaxError
      ? {
          ok: false,
          code: 'INVALID_JSON',
          message:
            'JSON inválido. Verifique aspas duplas, vírgulas e o fechamento de chaves e colchetes. O texto não foi corrigido automaticamente.',
        }
      : {
          ok: false,
          code: 'PROCESSING_LIMIT',
          message:
            'O navegador não conseguiu analisar esta estrutura. Reduza a profundidade ou o tamanho do JSON.',
        };
  }
  try {
    if (mode === 'validate') return { ok: true, value: input };
    const value = stringifyWithinBudget(parsed, mode, indentation);
    if (value === undefined) throw new TypeError('No serialized result');
    return { ok: true, value };
  } catch (error: unknown) {
    return error instanceof OutputLimitError
      ? {
          ok: false,
          code: 'OUTPUT_TOO_LARGE',
          message:
            'O resultado excederia 8 MiB. Nenhum resultado parcial foi gerado. Tente minificar ou reduza a estrutura.',
        }
      : {
          ok: false,
          code: 'PROCESSING_LIMIT',
          message:
            'A profundidade ou os recursos necessários excedem a capacidade deste navegador. Reduza a estrutura e tente novamente.',
        };
  }
}
