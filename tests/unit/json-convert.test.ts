import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { convertJson } from '../../src/lib/tools/json-convert';
import { JSON_OUTPUT_LIMIT_BYTES } from '../../src/lib/tools/json';

describe('JSON para CSV/XML/YAML', () => {
  it.each([
    '\u007f',
    '\u0080',
    '\u0085',
    '\u009f',
    '\ufffe',
    '\uffff',
    '\ufeff',
    '\u2028',
  ])(
    'preserva escalares Unicode especiais em YAML sem caracteres brutos não imprimíveis',
    async (char) => {
      const value = { [`key${char}`]: `value${char}` };
      const result = await convertJson(JSON.stringify(value), 'YAML');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(parse(result.value)).toEqual(value);
        if (char !== '\u2028') expect(result.value).not.toContain(char);
      }
    },
  );
  it('gera CSV com união ordenada, null/ausente, nested, aspas e CRLF', async () => {
    const input = JSON.stringify([
      { nome: 'é😀', ativo: true, nota: 'a,b\n"c"' },
      { nome: 'Bia', extra: { x: 1 }, n: null },
    ]);
    expect(await convertJson(input, 'CSV')).toEqual({
      ok: true,
      value:
        '"nome","ativo","nota","extra","n"\r\n"é😀","true","a,b\n""c""","",""\r\n"Bia","","","{""x"":1}",""\r\n',
    });
    expect(await convertJson('{"a":-2,"b":false}', 'CSV', ';')).toEqual({
      ok: true,
      value: '"a";"b"\r\n"-2";"false"\r\n',
    });
  });
  it.each(['[]', '[{}]', '{}', '1', 'null', '[1]', '[{},1]'])(
    'rejeita forma sem tabela: %s',
    async (input) => {
      expect((await convertJson(input, 'CSV')).ok).toBe(false);
    },
  );
  it.each([
    '=SUM(1,2)',
    ' +1',
    '-2',
    '@x',
    '\tx',
    '\rX',
    '\nX',
    '  ＝x',
    '＋x',
    '－x',
    '＠x',
    '\u2003=1',
    '\u200b=1',
    '\u0000=1',
  ])(
    'bloqueia string potencialmente executável em célula e cabeçalho',
    async (value) => {
      for (const input of [
        JSON.stringify({ text: value }),
        JSON.stringify({ [value]: 1 }),
      ]) {
        const result = await convertJson(input, 'CSV');
        expect(result).toMatchObject({ ok: false, code: 'CSV_FORMULA' });
        if (!result.ok) expect(result.message).not.toContain(value);
      }
    },
  );
  it('trata chaves de protótipo como dados próprios', async () => {
    expect(
      await convertJson('[{"__proto__":"texto","constructor":1},{}]', 'CSV'),
    ).toEqual({
      ok: true,
      value: '"__proto__","constructor"\r\n"texto","1"\r\n"",""\r\n',
    });
    expect(Object.prototype).not.toHaveProperty('texto');
  });
  it('emite XML tipado e escapa atributos/texto sem entidades externas', async () => {
    expect(
      await convertJson(
        JSON.stringify({ 'a\t\n\r"<&': 'x\r<&>', lista: [null, true, {}, []] }),
        'XML',
      ),
    ).toEqual({
      ok: true,
      value:
        '<?xml version="1.0" encoding="UTF-8"?>\n<json type="object">\n  <entry key="a&#9;&#10;&#13;&quot;&lt;&amp;" type="string">x&#13;&lt;&amp;&gt;</entry>\n  <entry key="lista" type="array">\n    <item type="null" />\n    <item type="boolean">true</item>\n    <item type="object">\n    </item>\n    <item type="array">\n    </item>\n  </entry>\n</json>\n',
    });
  });
  it.each(['\u0000', '\u001f', '\ufffe', '\uffff'])(
    'rejeita caracteres XML ilegais',
    async (value) => {
      expect(
        await convertJson(JSON.stringify({ [value]: 1 }), 'XML'),
      ).toMatchObject({ ok: false, code: 'INVALID_XML_CHARACTER' });
    },
  );
  it.each(['CSV', 'XML', 'YAML'] as const)(
    'verifica entrada, número, Unicode e recursos: %s',
    async (format) => {
      expect(await convertJson('', format)).toMatchObject({
        ok: false,
        code: 'EMPTY_INPUT',
      });
      expect(await convertJson('{', format)).toMatchObject({
        ok: false,
        code: 'INVALID_JSON',
      });
      expect(await convertJson(' '.repeat(1_048_577), format)).toMatchObject({
        ok: false,
        code: 'INPUT_TOO_LARGE',
      });
      expect(await convertJson('{"n":1e400}', format)).toMatchObject({
        ok: false,
        code: 'NON_FINITE_NUMBER',
      });
      expect(await convertJson('{"x":"\\ud800"}', format)).toMatchObject({
        ok: false,
        code: 'INVALID_UNICODE',
      });
      expect(
        await convertJson('['.repeat(129) + '0' + ']'.repeat(129), format),
      ).toMatchObject({ ok: false, code: 'CONVERSION_DEPTH' });
      expect(
        await convertJson(
          '[' + Array(50_000).fill('0').join(',') + ']',
          format,
        ),
      ).toMatchObject({ ok: false, code: 'CONVERSION_NODES' });
    },
  );
  it.each(['XML', 'YAML'] as const)(
    'aceita as fronteiras de 128 níveis e 50.000 nós: %s',
    async (format) => {
      expect(
        (await convertJson('['.repeat(128) + '0' + ']'.repeat(128), format)).ok,
      ).toBe(true);
      expect(
        (
          await convertJson(
            '[' + Array(49_999).fill('0').join(',') + ']',
            format,
          )
        ).ok,
      ).toBe(true);
      const exact = '"' + 'é'.repeat((1_048_576 - 2) / 2) + '"';
      expect((await convertJson(exact, format)).ok).toBe(true);
    },
  );
  it('emite YAML cotado com tipos/Unicode preservados e sem aliases', async () => {
    const source = {
      s: ['true', '01', '2026-10-30', 'é😀', 'a\r\nb', '\u0000'],
      n: [1, false, null, {}, []],
    };
    const result = await convertJson(JSON.stringify(source), 'YAML');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(parse(result.value)).toEqual(source);
      expect(result.value).toContain('"true"');
      expect(result.value).not.toMatch(/!!|&a\d|\*a\d/);
    }
  });
  it('rejeita estimativa YAML expansiva antes de emitir resultado', async () => {
    const source =
      '['.repeat(120) +
      '[' +
      Array(18_000).fill('0').join(',') +
      ']' +
      ']'.repeat(120);
    expect(await convertJson(source, 'YAML')).toMatchObject({
      ok: false,
      code: 'YAML_ESTIMATE_LIMIT',
    });
  });
  it('CSV aceita exatamente 8 MiB e recusa um byte a mais sem saída parcial', async () => {
    const rows = Array.from({ length: 1600 }, (_, index) => ({
      ['c' + index]: 'x',
    }));
    const initial = await convertJson(JSON.stringify(rows), 'CSV');
    expect(initial.ok).toBe(true);
    if (!initial.ok) return;
    const padding =
      JSON_OUTPUT_LIMIT_BYTES - new TextEncoder().encode(initial.value).length;
    expect(padding).toBeGreaterThan(0);
    rows[0] = { c0: 'x' + 'a'.repeat(padding) };
    const source = JSON.stringify(rows);
    expect(source.length).toBeLessThan(1_048_576);
    const exact = await convertJson(source, 'CSV');
    expect(exact.ok).toBe(true);
    if (exact.ok)
      expect(new TextEncoder().encode(exact.value).length).toBe(
        JSON_OUTPUT_LIMIT_BYTES,
      );
    rows[0] = { c0: 'xa' + 'a'.repeat(padding) };
    expect(await convertJson(JSON.stringify(rows), 'CSV')).toMatchObject({
      ok: false,
      code: 'OUTPUT_TOO_LARGE',
    });
  });
  it('XML interrompe expansão de saída sem retornar prefixo', async () => {
    const source =
      '['.repeat(120) +
      '[' +
      Array(32_000).fill('null').join(',') +
      ']' +
      ']'.repeat(120);
    expect(await convertJson(source, 'XML')).toMatchObject({
      ok: false,
      code: 'OUTPUT_TOO_LARGE',
    });
  });
});
