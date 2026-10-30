import { describe, expect, it } from 'vitest';
import {
  encodeUrlComponent,
  decodeUrlComponent,
} from '../../src/lib/tools/url-component';
import {
  URL_EXAMPLE_TEXT,
  URL_EXAMPLE_ENCODED,
} from '../../src/data/url-example';

describe('componente de URL nativo e local', () => {
  it.each([
    ['', ''],
    [URL_EXAMPLE_TEXT, URL_EXAMPLE_ENCODED],
    ['&%?#/=+: ', '%26%25%3F%23%2F%3D%2B%3A%20'],
    ["AZaz09-_.!~*'()", "AZaz09-_.!~*'()"],
    ['é😀', '%C3%A9%F0%9F%98%80'],
    ['e\u0301', 'e%CC%81'],
    ['\uFEFFtexto', '%EF%BB%BFtexto'],
    ['\r\n\u0000\t', '%0D%0A%00%09'],
    ['%20', '%2520'],
    ['<script>"&', '%3Cscript%3E%22%26'],
  ])('codifica %j e recupera o texto exato', (text, encoded) => {
    expect(encodeUrlComponent(text)).toEqual({ ok: true, value: encoded });
    expect(decodeUrlComponent(encoded)).toEqual({ ok: true, value: text });
  });

  it.each([
    ['a+b%20c', 'a+b c'],
    ['%2520', '%20'],
    ['%2f%2F', '//'],
    ['á 😀', 'á 😀'],
    ['\uD800', '\uD800'],
  ])('decodifica uma vez sem reparar ou normalizar %j', (input, value) => {
    expect(decodeUrlComponent(input)).toEqual({ ok: true, value });
  });

  it.each([
    '%',
    '%2',
    '%GG',
    'a%20b%',
    '%FF',
    '%C0%AF',
    '%ED%A0%80',
    '%E2%82',
    '%F4%90%80%80',
    '%80',
  ])('rejeita escape ou UTF-8 inválido %j', (input) => {
    const result = decodeUrlComponent(input);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_COMPONENT' });
    expect(result).not.toHaveProperty('value');
  });

  it.each(['\uD800', '\uDC00', 'x\uD800y', '\uD800\uD800'])(
    'não substitui surrogate isolado %j ao codificar',
    (input) => {
      expect(encodeUrlComponent(input)).toMatchObject({
        ok: false,
        code: 'INVALID_UNICODE',
      });
    },
  );

  it('aceita a fronteira ASCII e limita a expansão a três vezes os bytes', () => {
    for (const n of [1048575, 1048576]) {
      const input = '%'.repeat(n);
      expect(encodeUrlComponent(input)).toEqual({
        ok: true,
        value: '%25'.repeat(n),
      });
    }
    expect(decodeUrlComponent('a'.repeat(1048576))).toEqual({
      ok: true,
      value: 'a'.repeat(1048576),
    });
    expect(decodeUrlComponent('%41'.repeat(349525) + 'a')).toEqual({
      ok: true,
      value: 'A'.repeat(349525) + 'a',
    });
  });

  it('mede bytes UTF-8 e não apenas caracteres', () => {
    expect(encodeUrlComponent('é'.repeat(524288))).toEqual({
      ok: true,
      value: '%C3%A9'.repeat(524288),
    });
    expect(encodeUrlComponent('é'.repeat(524288) + 'a')).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
  });

  it.each([encodeUrlComponent, decodeUrlComponent])(
    'rejeita entrada acima do limite antes de converter',
    (convert) => {
      expect(convert('%'.repeat(1048577))).toMatchObject({
        ok: false,
        code: 'INPUT_TOO_LARGE',
      });
    },
  );

  it('não aceita uma saída expandida acima do limite como nova entrada', () => {
    const result = encodeUrlComponent('%'.repeat(1048576));
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(decodeUrlComponent(result.value)).toMatchObject({
        ok: false,
        code: 'INPUT_TOO_LARGE',
      });
  });
});
