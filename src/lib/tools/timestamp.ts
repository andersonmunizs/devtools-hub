import type { ToolResult } from '../../types/tool-result';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../text-input';

export type TimestampUnit = 'seconds' | 'milliseconds';
export const DATE_LIMIT_MS = 8_640_000_000_000_000;

export function parseTimestamp(
  input: string,
  unit: TimestampUnit,
): ToolResult<number> {
  const bytes = getTextInputSize(input);
  if (bytes === null || bytes > TEXT_INPUT_LIMIT_BYTES) {
    return {
      ok: false,
      code: 'INPUT_TOO_LARGE',
      message:
        'A entrada excede 1 MiB (1.048.576 bytes UTF-8). Reduza o texto antes de processar.',
    };
  }
  // Linear grammar; parse decimal parts separately to avoid floating-point rounding.
  const match = /^([+-]?)([0-9]+)(?:\.([0-9]{1,3}))?$/.exec(input);
  if (
    !match ||
    match[0] !== input ||
    (unit === 'milliseconds' && match[3] !== undefined)
  ) {
    return {
      ok: false,
      code: 'INVALID_TIMESTAMP',
      message:
        unit === 'seconds'
          ? 'Informe segundos decimais, com ponto e até três casas. Use apenas dígitos e sinal opcional, sem espaços ou notação exponencial.'
          : 'Informe milissegundos inteiros. Use apenas dígitos e sinal opcional, sem espaços, separadores ou notação exponencial.',
    };
  }
  const whole = (match[2] ?? '').replace(/^0+/, '') || '0';
  const maxDigits = unit === 'seconds' ? 13 : 16;
  if (whole.length > maxDigits) return rangeError();
  const magnitude =
    unit === 'seconds'
      ? BigInt(whole) * 1000n + BigInt((match[3] ?? '').padEnd(3, '0'))
      : BigInt(whole);
  if (magnitude > BigInt(DATE_LIMIT_MS)) return rangeError();
  return { ok: true, value: Number(match[1] === '-' ? -magnitude : magnitude) };
}

function rangeError(): ToolResult<never> {
  return {
    ok: false,
    code: 'OUT_OF_RANGE',
    message:
      'Data fora da faixa suportada: de −8.640.000.000.000.000 a +8.640.000.000.000.000 milissegundos desde a época Unix.',
  };
}

function secondsFromMilliseconds(ms: number): string {
  const magnitude = BigInt(Math.abs(ms));
  const fraction = (magnitude % 1000n)
    .toString()
    .padStart(3, '0')
    .replace(/0+$/, '');
  return `${ms < 0 ? '-' : ''}${magnitude / 1000n}${fraction ? `.${fraction}` : ''}`;
}

export function convertTimestamp(
  input: string,
  unit: TimestampUnit,
  timeZone: string,
): ToolResult<string> {
  const parsed = parseTimestamp(input, unit);
  if (!parsed.ok) return parsed;
  if (!timeZone) return timeZoneError();
  try {
    const date = new Date(parsed.value);
    const local = new Intl.DateTimeFormat('pt-BR-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      era: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    }).format(date);
    return {
      ok: true,
      value: [
        `UTC (ISO 8601): ${date.toISOString()}`,
        `Horário no navegador (${timeZone}): ${local}`,
        `Unix em segundos: ${secondsFromMilliseconds(parsed.value)}`,
        `Unix em milissegundos: ${parsed.value}`,
      ].join('\n'),
    };
  } catch {
    return timeZoneError();
  }
}

function timeZoneError(): ToolResult<never> {
  return {
    ok: false,
    code: 'UNSUPPORTED_TIME_ZONE',
    message:
      'Não foi possível representar o fuso horário neste navegador. Nenhum fuso substituto foi aplicado.',
  };
}

export function convertBrowserTimestamp(
  input: string,
  unit: TimestampUnit,
): ToolResult<string> {
  try {
    return convertTimestamp(
      input,
      unit,
      new Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  } catch {
    return timeZoneError();
  }
}
