import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from '../../src/lib/tools/base64';
import {
  BASE64_EXAMPLE_ENCODED,
  BASE64_EXAMPLE_TEXT,
} from '../../src/data/base64-example';
import { TEXT_INPUT_LIMIT_BYTES } from '../../src/lib/text-input';

describe('Base64 padrão e UTF-8 estrito', () => {
  it.each([
    ['', ''],
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foob', 'Zm9vYg=='],
    ['fooba', 'Zm9vYmE='],
    ['foobar', 'Zm9vYmFy'],
    [BASE64_EXAMPLE_TEXT, BASE64_EXAMPLE_ENCODED],
  ])('vetor conhecido %j ↔ %s', (text, encoded) => {
    expect(encodeBase64(text)).toEqual({ ok: true, value: encoded });
    expect(decodeBase64(encoded)).toEqual({ ok: true, value: text });
  });
  it.each([
    '\uFEFFtexto',
    '\u0000\n\r\t espaço ',
    'e\u0301 é',
    'العربية 世界 😀',
    '\u{10ffff}',
    '<img src=x onerror=alert(1)><script>alert(1)</script>',
  ])('roundtrip sem normalizar Unicode ou executar texto: %j', (input) => {
    const encoded = encodeBase64(input);
    expect(encoded).toEqual({
      ok: true,
      value: Buffer.from(input, 'utf8').toString('base64'),
    });
    if (encoded.ok)
      expect(decodeBase64(encoded.value)).toEqual({ ok: true, value: input });
  });
  it.each(['\ud800', '\udc00', 'x\ud800y', '\ud800\ud800', '😀\udc00'])(
    'rejeita surrogate isolado',
    (input) => {
      expect(encodeBase64(input)).toMatchObject({
        ok: false,
        code: 'INVALID_UNICODE',
      });
    },
  );
  it.each([
    'Zg',
    'Zg=',
    'Zg===',
    'A',
    '====',
    'A===',
    'AA=A',
    ' Zg==',
    'Zg==\n',
    'Z g==',
    'Zg==\r\n',
    'AA-_',
    'é===',
    'Zg==Zg==',
    'TR==',
    'TWF=',
    'Zh==',
    'Zm9=',
  ])('rejeita sintaxe ou padding não canônico: %j', (input) => {
    expect(decodeBase64(input)).toMatchObject({
      ok: false,
      code: 'INVALID_BASE64',
    });
  });
  it.each(['/w==', 'wyg=', 'wK8=', '7aCA', '9JCAgA==', '4oI=', 'gA=='])(
    'rejeita UTF-8 inválido sem mojibake: %s',
    (input) => {
      expect(decodeBase64(input)).toMatchObject({
        ok: false,
        code: 'INVALID_UTF8',
      });
    },
  );
  it('preserva BOM inicial explicitamente', () => {
    expect(decodeBase64('77u/WA==')).toEqual({ ok: true, value: '\uFEFFX' });
  });
  it.each([-1, 0, 1])('aplica o limite ASCII de entrada: %i', (delta) => {
    const input = 'a'.repeat(TEXT_INPUT_LIMIT_BYTES + delta);
    const result = encodeBase64(input);
    if (delta > 0)
      expect(result).toMatchObject({ ok: false, code: 'INPUT_TOO_LARGE' });
    else
      expect(result).toEqual({
        ok: true,
        value: Buffer.from(input).toString('base64'),
      });
  });
  it('mede bytes multibyte e rejeita excesso em ambas as direções', () => {
    const exact = 'é'.repeat(TEXT_INPUT_LIMIT_BYTES / 2);
    expect(encodeBase64(exact).ok).toBe(true);
    expect(encodeBase64(exact + 'x')).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
    expect(decodeBase64('A'.repeat(TEXT_INPUT_LIMIT_BYTES + 4))).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
  });
  it('decodifica exatamente 1 MiB de Base64 e informa o limite ao tentar reusar saída maior', () => {
    const encoded = 'YWFh'.repeat(TEXT_INPUT_LIMIT_BYTES / 4);
    expect(decodeBase64(encoded)).toEqual({
      ok: true,
      value: 'a'.repeat(786432),
    });
    const large = encodeBase64('a'.repeat(TEXT_INPUT_LIMIT_BYTES));
    if (!large.ok) throw Error('Unexpected encoding failure');
    expect(large.value.length).toBe(1398104);
    expect(decodeBase64(large.value)).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
  });
});
