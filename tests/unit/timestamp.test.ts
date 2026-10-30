import { describe, expect, it } from 'vitest';
import {
  convertTimestamp,
  parseTimestamp,
  DATE_LIMIT_MS,
  type TimestampUnit,
} from '../../src/lib/tools/timestamp';
import {
  TIMESTAMP_EXAMPLE_ISO,
  TIMESTAMP_EXAMPLE_SECONDS,
  TIMESTAMP_EXAMPLE_MILLISECONDS,
} from '../../src/data/timestamp-example';

describe('timestamp com unidade explícita e precisão de milissegundo', () => {
  it.each([
    ['0', 'seconds', 0],
    ['-1', 'seconds', -1000],
    ['-0.001', 'seconds', -1],
    ['1.001', 'seconds', 1001],
    ['0.009', 'seconds', 9],
    ['123.12', 'seconds', 123120],
    ['-1.999', 'seconds', -1999],
    ['+001.010', 'seconds', 1010],
    ['-0', 'milliseconds', 0],
    ['001', 'milliseconds', 1],
    [TIMESTAMP_EXAMPLE_SECONDS, 'seconds', 1700000000000],
    [TIMESTAMP_EXAMPLE_MILLISECONDS, 'milliseconds', 1700000000000],
  ] satisfies [string, TimestampUnit, number][])(
    'interpreta %s como %s sem arredondar',
    (input, unit, ms) => {
      expect(parseTimestamp(input, unit)).toEqual({ ok: true, value: ms });
    },
  );

  it.each([
    '',
    ' ',
    ' 1',
    '1 ',
    '1\n',
    '1\r\n',
    '1\t',
    'NaN',
    'Infinity',
    '-Infinity',
    '1e3',
    '0x10',
    '1,5',
    '.5',
    '1.',
    '--1',
    '1.0001',
    '١',
    '😀',
    '<img src=x onerror=alert(1)>',
  ])('rejeita entrada inválida em segundos %j', (input) => {
    expect(parseTimestamp(input, 'seconds')).toMatchObject({
      ok: false,
      code: 'INVALID_TIMESTAMP',
    });
  });

  it.each(['1.0', '-0.001', '1.001', '1e3', '1\n'])(
    'rejeita frações/notação indevida em milissegundos %j',
    (input) => {
      expect(parseTimestamp(input, 'milliseconds')).toMatchObject({
        ok: false,
        code: 'INVALID_TIMESTAMP',
      });
    },
  );

  it.each([
    ['8640000000000000', 'milliseconds', DATE_LIMIT_MS],
    ['-8640000000000000', 'milliseconds', -DATE_LIMIT_MS],
    ['8640000000000.000', 'seconds', DATE_LIMIT_MS],
    ['-8640000000000.000', 'seconds', -DATE_LIMIT_MS],
    ['8639999999999.999', 'seconds', DATE_LIMIT_MS - 1],
    ['-8639999999999.999', 'seconds', -DATE_LIMIT_MS + 1],
  ] satisfies [string, TimestampUnit, number][])(
    'aceita fronteira %s %s',
    (input, unit, value) => {
      expect(parseTimestamp(input, unit)).toEqual({ ok: true, value });
    },
  );

  it.each([
    ['8640000000000001', 'milliseconds'],
    ['-8640000000000001', 'milliseconds'],
    ['8640000000000.001', 'seconds'],
    ['-8640000000000.001', 'seconds'],
    ['9007199254740993', 'milliseconds'],
    ['9'.repeat(100000), 'seconds'],
  ] satisfies [string, TimestampUnit][])(
    'rejeita fronteira excedida %s %s',
    (input, unit) => {
      expect(parseTimestamp(input, unit)).toMatchObject({
        ok: false,
        code: 'OUT_OF_RANGE',
      });
    },
  );

  it('mantém limite de 1 MiB e aceita zeros de entrada sem BigInt gigante', () => {
    expect(parseTimestamp('0'.repeat(1048576), 'seconds')).toEqual({
      ok: true,
      value: 0,
    });
    expect(parseTimestamp('0'.repeat(1048575) + '1', 'milliseconds')).toEqual({
      ok: true,
      value: 1,
    });
    expect(parseTimestamp('0'.repeat(1048577), 'seconds')).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
    expect(
      parseTimestamp('é'.repeat(524288) + 'a', 'milliseconds'),
    ).toMatchObject({ ok: false, code: 'INPUT_TOO_LARGE' });
  });

  it('o mesmo número em duas unidades representa instantes diferentes', () => {
    expect(convertTimestamp('1', 'seconds', 'UTC')).toMatchObject({
      ok: true,
      value: expect.stringContaining('1970-01-01T00:00:01.000Z'),
    });
    expect(convertTimestamp('1', 'milliseconds', 'UTC')).toMatchObject({
      ok: true,
      value: expect.stringContaining('1970-01-01T00:00:00.001Z'),
    });
  });

  it('produz UTC e ambos os timestamps exatos no exemplo', () => {
    const result = convertTimestamp(
      TIMESTAMP_EXAMPLE_SECONDS,
      'seconds',
      'America/Cuiaba',
    );
    expect(result).toMatchObject({
      ok: true,
      value: expect.stringContaining(
        `UTC (ISO 8601): ${TIMESTAMP_EXAMPLE_ISO}`,
      ),
    });
    if (result.ok) {
      expect(result.value).toContain('Horário no navegador (America/Cuiaba):');
      expect(result.value).toContain('18:13:20');
      expect(result.value).toContain('GMT-04:00');
      expect(result.value).toContain(
        'Unix em segundos: 1700000000\nUnix em milissegundos: 1700000000000',
      );
    }
  });

  it.each([
    ['-0.001', '-1'],
    ['1.001', '1001'],
    ['1.100', '1100'],
  ])('serializa segundos %s sem perda', (seconds, ms) => {
    const result = convertTimestamp(ms, 'milliseconds', 'UTC');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain(`Unix em milissegundos: ${ms}`);
      expect(result.value).toContain(
        `Unix em segundos: ${seconds === '1.100' ? '1.1' : seconds}\n`,
      );
    }
  });

  it.each([
    ['8640000000000000', '+275760-09-13T00:00:00.000Z'],
    ['-8640000000000000', '-271821-04-20T00:00:00.000Z'],
    ['-62167219200000', '0000-01-01T00:00:00.000Z'],
  ])('formata anos estendidos e era na fronteira %s', (input, iso) => {
    const result = convertTimestamp(input, 'milliseconds', 'UTC');
    expect(result).toMatchObject({
      ok: true,
      value: expect.stringContaining(iso),
    });
  });

  it('usa regras nativas na entrada e saída do horário de verão', () => {
    // US DST in New York, 2024: spring gap and autumn repeated hour.
    for (const [iso, hour, offset] of [
      ['2024-03-10T06:59:59Z', '01:59:59', 'GMT-05:00'],
      ['2024-03-10T07:00:00Z', '03:00:00', 'GMT-04:00'],
      ['2024-11-03T05:30:00Z', '01:30:00', 'GMT-04:00'],
      ['2024-11-03T06:30:00Z', '01:30:00', 'GMT-05:00'],
    ]) {
      const result = convertTimestamp(
        String(Date.parse(iso ?? '')),
        'milliseconds',
        'America/New_York',
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain(hour);
        expect(result.value).toContain(offset);
      }
    }
  });

  it('suporta deslocamentos fracionários sem confundir UTC', () => {
    const result = convertTimestamp('0', 'seconds', 'Asia/Kolkata');
    expect(result).toMatchObject({
      ok: true,
      value: expect.stringContaining('05:30:00'),
    });
    if (result.ok) expect(result.value).toContain('GMT+05:30');
  });

  it.each(['', 'Mars/Olympus'])(
    'falha explicitamente em fuso não suportado %s',
    (zone) => {
      expect(convertTimestamp('0', 'seconds', zone)).toMatchObject({
        ok: false,
        code: 'UNSUPPORTED_TIME_ZONE',
      });
    },
  );
});
