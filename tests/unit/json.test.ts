import { describe, expect, it } from 'vitest';
import { JSON_EXAMPLE } from '../../src/data/json-example';
import {
  getJsonInputSize,
  JSON_INPUT_LIMIT_BYTES,
  JSON_OUTPUT_LIMIT_BYTES,
  transformJson,
} from '../../src/lib/tools/json';

describe('JSON nativo com limites', () => {
  it.each([
    '{}',
    '[]',
    'null',
    'true',
    'false',
    '0',
    '-0',
    '1e400',
    '9007199254740993',
    '"texto"',
    '"Olá, 世界 😀"',
    '"\\ud800"',
    '"\ud800"',
    '[1,{"x":[null,[]]},true]',
    '{"10":1,"2":2,"b":3,"a":4}',
    '{"x":1,"x":2}',
    JSON.stringify({ escape: '\n\t"\\' }),
  ])('preserva a semântica nativa de %s', (input) => {
    for (const mode of ['format', 'minify'] as const) {
      expect(transformJson(input, mode)).toEqual({
        ok: true,
        value: JSON.stringify(
          JSON.parse(input),
          null,
          mode === 'format' ? 2 : undefined,
        ),
      });
    }
  });
  it.each(['', ' ', '\n\t\r'])('retorna erro de entrada vazia', (input) => {
    expect(transformJson(input, 'format')).toMatchObject({
      ok: false,
      code: 'EMPTY_INPUT',
    });
  });
  it.each([
    '{',
    '[1,]',
    '{"x":}',
    "{'x':1}",
    'undefined',
    'NaN',
    'true false',
    '/* comentário */ {}',
    '\uFEFF{}',
    '<img src=x onerror=alert(1)>',
  ])('rejeita entrada malformada sem corrigir: %s', (input) => {
    expect(transformJson(input, 'format')).toMatchObject({
      ok: false,
      code: 'INVALID_JSON',
    });
  });
  it('formata com dois espaços e minifica com oráculo explícito', () => {
    expect(transformJson('{"a":[1,true,null]}', 'format')).toEqual({
      ok: true,
      value: '{\n  "a": [\n    1,\n    true,\n    null\n  ]\n}',
    });
    expect(transformJson(' { "a" : [ 1, true, null ] } ', 'minify')).toEqual({
      ok: true,
      value: '{"a":[1,true,null]}',
    });
  });
  it('trata chaves especiais e HTML como dados sem poluir protótipos', () => {
    const input =
      '{"__proto__":{"polluted":"sim"},"constructor":{"prototype":{"polluted":"sim"}},"toJSON":"texto","html":"<script>window.pwned=true</script>"}';
    expect(transformJson(input, 'minify')).toEqual({ ok: true, value: input });
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
  });
  it('mantém exemplo sintético Unicode verificável', () => {
    const result = transformJson(JSON_EXAMPLE, 'format');
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(JSON.parse(result.value)).toMatchObject({
        projeto: 'Exemplo sintético',
        itens: [{ nome: 'Olá, 世界 😀', quantidade: 2 }],
      });
  });
  it('mede UTF-8 e os surrogates conforme TextEncoder', () => {
    for (const input of ['Olá, 世界 😀', '\ud800', '\udc00', '\ud83d\ude00'])
      expect(getJsonInputSize(input)).toBe(
        new TextEncoder().encode(input).length,
      );
  });
  it.each([-1, 0, 1])(
    'verifica a fronteira ASCII de 1 MiB (%i byte)',
    (delta) => {
      const input = '"' + 'x'.repeat(JSON_INPUT_LIMIT_BYTES - 2 + delta) + '"';
      const result = transformJson(input, 'minify');
      if (delta > 0)
        expect(result).toMatchObject({ ok: false, code: 'INPUT_TOO_LARGE' });
      else expect(result).toEqual({ ok: true, value: input });
    },
  );
  it('rejeita excesso multibyte mesmo com length menor que o limite', () => {
    const input = '"' + '😀'.repeat(JSON_INPUT_LIMIT_BYTES / 4) + '"';
    expect(input.length).toBeLessThan(JSON_INPUT_LIMIT_BYTES);
    expect(transformJson(input, 'format')).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
    const exact = '"' + 'é'.repeat((JSON_INPUT_LIMIT_BYTES - 2) / 2) + '"';
    expect(getJsonInputSize(exact)).toBe(JSON_INPUT_LIMIT_BYTES);
    expect(transformJson(exact, 'minify')).toEqual({ ok: true, value: exact });
  });
  it('recusa expansão patológica, mas permite minificar a mesma entrada', () => {
    const input =
      '['.repeat(1024) +
      '[' +
      Array<string>(5001).fill('0').join(',') +
      ']' +
      ']'.repeat(1024);
    expect(transformJson(input, 'format')).toMatchObject({
      ok: false,
      code: 'OUTPUT_TOO_LARGE',
    });
    expect(transformJson(input, 'minify')).toEqual({ ok: true, value: input });
  });
  it.each(['array', 'object'])(
    'aceita exatamente 8 MiB de saída e rejeita um byte extra (%s)',
    (kind) => {
      const makeInput = (filler: number) =>
        (kind === 'object' ? '{"é😀\\ud800":' : '') +
        '['.repeat(1024) +
        '["' +
        'x'.repeat(filler) +
        '"' +
        ',0'.repeat(2999) +
        ']' +
        ']'.repeat(1024) +
        (kind === 'object' ? ',"fim":null}' : '');
      const base = JSON.stringify(JSON.parse(makeInput(0)), null, 2);
      const filler =
        JSON_OUTPUT_LIMIT_BYTES - new TextEncoder().encode(base).length;
      expect(filler).toBeGreaterThan(0);
      for (const delta of [0, 1]) {
        const input = makeInput(filler + delta);
        expect(getJsonInputSize(input)).toBeLessThan(JSON_INPUT_LIMIT_BYTES);
        const result = transformJson(input, 'format');
        if (delta === 1)
          expect(result).toMatchObject({ ok: false, code: 'OUTPUT_TOO_LARGE' });
        else {
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(new TextEncoder().encode(result.value).length).toBe(
              JSON_OUTPUT_LIMIT_BYTES,
            );
            expect(result.value).toBe(
              JSON.stringify(JSON.parse(input), null, 2),
            );
          }
        }
      }
    },
  );
  it('retorna erro de recursos para profundidade que excede o serializador', () => {
    const input = '['.repeat(20000) + '0' + ']'.repeat(20000);
    expect(transformJson(input, 'minify')).toMatchObject({
      ok: false,
      code: 'PROCESSING_LIMIT',
    });
  });
});
