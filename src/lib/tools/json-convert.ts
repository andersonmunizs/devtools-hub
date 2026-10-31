import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';
import { hasIsolatedSurrogate } from '../unicode';
import { JSON_OUTPUT_LIMIT_BYTES } from './json';
import type { ToolResult } from '../../types/tool-result';

export type ConversionFormat = 'CSV' | 'XML' | 'YAML';
export type CsvSeparator = ',' | ';';
export const CONVERSION_DEPTH_LIMIT = 128;
export const CONVERSION_NODE_LIMIT = 50_000;
type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const encoder = new TextEncoder();
class ConversionError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new ConversionError(code, message);
}

/** Count bytes before retaining a fragment; never return partial output. */
class Output {
  private chunks: string[] = [];
  private bytes = 0;
  private buffer = '';
  add(text: string) {
    this.bytes += encoder.encode(text).length;
    if (this.bytes > JSON_OUTPUT_LIMIT_BYTES)
      fail(
        'OUTPUT_TOO_LARGE',
        'A conversão excederia 8 MiB. Nenhum resultado parcial foi gerado.',
      );
    this.buffer += text;
    if (this.buffer.length >= 8192) {
      this.chunks.push(this.buffer);
      this.buffer = '';
    }
  }
  finish() {
    return [...this.chunks, this.buffer].join('');
  }
}
function object(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function inspect(root: JsonValue, format: ConversionFormat) {
  const pending = [{ value: root, depth: 0 }];
  let nodes = 0;
  let estimate = 32;
  const inspectString = (text: string) => {
    if (hasIsolatedSurrogate(text))
      fail(
        'INVALID_UNICODE',
        'A conversão exige Unicode válido. Há um surrogate isolado em uma chave ou valor.',
      );
    if (format === 'XML')
      for (const char of text) {
        const point = char.codePointAt(0)!;
        if (!(
          point === 9 ||
          point === 10 ||
          point === 13 ||
          (point >= 32 && point <= 0xd7ff) ||
          (point >= 0xe000 && point <= 0xfffd) ||
          point >= 0x10000
        ))
          fail(
            'INVALID_XML_CHARACTER',
            'Uma chave ou valor contém caractere incompatível com XML 1.0. Nenhum caractere foi removido.',
          );
      }
    let bytes = encoder.encode(JSON.stringify(text)).length;
    if (format === 'YAML')
      for (const char of text) {
        const code = char.charCodeAt(0);
        if (
          (code >= 0x7f && code <= 0x9f) ||
          code === 0xfeff ||
          code === 0xfffe ||
          code === 0xffff
        )
          bytes += 6 - encoder.encode(char).length;
      }
    return bytes;
  };
  while (pending.length) {
    const current = pending.pop()!;
    if (++nodes > CONVERSION_NODE_LIMIT)
      fail(
        'CONVERSION_NODES',
        'A conversão aceita até 50.000 valores e contêineres. Reduza a estrutura.',
      );
    if (current.depth > CONVERSION_DEPTH_LIMIT)
      fail(
        'CONVERSION_DEPTH',
        'A conversão aceita até 128 níveis abaixo da raiz. Reduza a profundidade.',
      );
    const { value, depth } = current;
    if (typeof value === 'number' && !Number.isFinite(value))
      fail(
        'NON_FINITE_NUMBER',
        'A conversão não aceita números fora do intervalo finito JavaScript. Use strings para preservar os dígitos.',
      );
    // YAML uses JSON-quoted strings/keys, block collections, two spaces and no
    // wrapping. Reserve more framing/indent bytes than the emitted schema needs.
    estimate += 32 + 4 * depth;
    if (typeof value === 'string') estimate += inspectString(value);
    else if (typeof value === 'number') estimate += String(value).length;
    const children = Array.isArray(value)
      ? value.length
      : object(value)
        ? Object.keys(value).length
        : 0;
    if (nodes + pending.length + children > CONVERSION_NODE_LIMIT)
      fail(
        'CONVERSION_NODES',
        'A conversão aceita até 50.000 valores e contêineres. Reduza a estrutura.',
      );
    if (Array.isArray(value))
      for (const child of value)
        pending.push({ value: child, depth: depth + 1 });
    else if (object(value))
      for (const key of Object.keys(value)) {
        estimate += inspectString(key) + 8;
        pending.push({ value: value[key]!, depth: depth + 1 });
      }
    if (format === 'YAML' && estimate > JSON_OUTPUT_LIMIT_BYTES)
      fail(
        'YAML_ESTIMATE_LIMIT',
        'A estimativa conservadora de YAML excede 8 MiB. Uma saída menor talvez coubesse; reduza a estrutura para converter.',
      );
  }
}

function csv(root: JsonValue, separator: CsvSeparator): string {
  const rows = object(root)
    ? [root]
    : Array.isArray(root) && root.length && root.every(object)
      ? root
      : null;
  if (!rows)
    fail(
      'CSV_SHAPE',
      'Para CSV, use um objeto ou um array não vazio de objetos. Arrays mistos e valores isolados não formam uma tabela.',
    );
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (!columns.length)
    fail(
      'CSV_COLUMNS',
      'Não há colunas para gerar CSV. Inclua ao menos uma chave.',
    );
  const output = new Output();
  function cell(value: JsonValue | undefined) {
    if (
      typeof value === 'string' &&
      (/^[\t\r\n]/u.test(value) ||
        /^[\p{White_Space}\p{Cf}\p{Cc}]*[=+\-@＝＋－＠]/u.test(value))
    )
      fail(
        'CSV_FORMULA',
        'Um cabeçalho ou célula de texto pode ser interpretado como fórmula em uma planilha. Nenhum CSV foi gerado nem o texto foi alterado. Importe dados confiáveis como texto.',
      );
    const text =
      value == null
        ? ''
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function row(values: (JsonValue | undefined)[]) {
    output.add(values.map(cell).join(separator) + '\r\n');
  }
  row(columns);
  for (const item of rows)
    row(
      columns.map((key) => (Object.hasOwn(item, key) ? item[key] : undefined)),
    );
  return output.finish();
}

function xml(root: JsonValue): string {
  const output = new Output();
  function escape(text: string, attribute = false) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')
      .replaceAll('\r', '&#13;')
      .replaceAll('\n', attribute ? '&#10;' : '\n')
      .replaceAll('\t', attribute ? '&#9;' : '\t');
  }
  function write(
    value: JsonValue,
    tag: 'json' | 'entry' | 'item',
    depth: number,
    key?: string,
  ) {
    const type =
      value === null
        ? 'null'
        : Array.isArray(value)
          ? 'array'
          : typeof value === 'object'
            ? 'object'
            : typeof value;
    const indent = '  '.repeat(depth);
    output.add(
      `${indent}<${tag}${key === undefined ? '' : ` key="${escape(key, true)}"`} type="${type}"`,
    );
    if (value === null) {
      output.add(' />\n');
      return;
    }
    if (typeof value !== 'object') {
      output.add(`>${escape(String(value))}</${tag}>\n`);
      return;
    }
    output.add('>\n');
    if (Array.isArray(value))
      for (const item of value) write(item, 'item', depth + 1);
    else
      for (const name of Object.keys(value))
        write(value[name]!, 'entry', depth + 1, name);
    output.add(`${indent}</${tag}>\n`);
  }
  output.add('<?xml version="1.0" encoding="UTF-8"?>\n');
  write(root, 'json', 0);
  return output.finish();
}

export async function convertJson(
  input: string,
  format: ConversionFormat,
  separator: CsvSeparator = ',',
): Promise<ToolResult<string>> {
  try {
    const bytes = getTextInputSize(input);
    if (bytes === null || bytes > TEXT_INPUT_LIMIT_BYTES)
      fail(
        'INPUT_TOO_LARGE',
        'A entrada excede 1 MiB (1.048.576 bytes UTF-8). Reduza o texto antes de converter.',
      );
    if (!input.trim())
      fail(
        'EMPTY_INPUT',
        'Insira um JSON ou use o exemplo sintético para começar.',
      );
    let value: JsonValue;
    try {
      value = JSON.parse(input) as JsonValue;
    } catch {
      return {
        ok: false,
        code: 'INVALID_JSON',
        message:
          'JSON inválido. Verifique aspas, vírgulas e o fechamento de chaves e colchetes.',
      };
    }
    inspect(value, format);
    if (format === 'CSV') return { ok: true, value: csv(value, separator) };
    if (format === 'XML') return { ok: true, value: xml(value) };
    const { stringify } = await import('yaml');
    const serialized = stringify(value, {
      version: '1.2',
      schema: 'json',
      indent: 2,
      lineWidth: 0,
      defaultStringType: 'QUOTE_DOUBLE',
      defaultKeyType: 'QUOTE_DOUBLE',
      doubleQuotedAsJSON: true,
      aliasDuplicateObjects: false,
    });
    // Keep non-printable JSON-compatible quoted scalars portable/readable in
    // YAML processors. These code points occur only within quoted strings.
    const result = serialized.replace(
      /[\u007f-\u009f\ufeff\ufffe\uffff]/gu,
      (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );
    const output = new Output();
    output.add(result);
    return { ok: true, value: output.finish() };
  } catch (error: unknown) {
    return error instanceof ConversionError
      ? { ok: false, code: error.code, message: error.message }
      : {
          ok: false,
          code: 'CONVERSION_FAILED',
          message:
            'Não foi possível converter esta estrutura neste navegador. Reduza o tamanho ou a profundidade e tente novamente.',
        };
  }
}
