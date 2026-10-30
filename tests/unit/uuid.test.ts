import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  browserUuidAvailable,
  generateBrowserUuids,
  generateUuids,
  parseUuidCount,
} from '../../src/lib/tools/uuid';

const nativeCrypto = globalThis.crypto;
const uuid = '00000000-0000-4000-8000-000000000001';
const pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
afterEach(() => vi.unstubAllGlobals());

describe('quantidade UUID e geração via Web Crypto', () => {
  it.each(Array.from({ length: 20 }, (_, i) => i + 1))(
    'aceita %i e invoca a fonte exatamente essa quantidade',
    (count) => {
      const source = vi.fn(() => uuid);
      expect(parseUuidCount(String(count))).toEqual({ ok: true, value: count });
      expect(generateUuids(String(count), source)).toEqual({
        ok: true,
        value: Array.from({ length: count }, () => uuid),
      });
      expect(source).toHaveBeenCalledTimes(count);
    },
  );
  it.each([
    '',
    '0',
    '-1',
    '21',
    '100',
    '1.0',
    '1.5',
    '+1',
    '01',
    ' 1',
    '1 ',
    '1\n',
    '1\r',
    '1\r\n',
    'NaN',
    'Infinity',
    '1e1',
    '0x10',
    '١',
    '😀',
    '<img src=x onerror=alert(1)>',
  ])('rejeita %j antes de gerar', (input) => {
    const source = vi.fn(() => uuid);
    expect(generateUuids(input, source)).toMatchObject({
      ok: false,
      code: 'INVALID_COUNT',
    });
    expect(source).not.toHaveBeenCalled();
  });
  it('impõe limite em bytes UTF-8 e não trunca uma quantidade longa', () => {
    expect(parseUuidCount('1'.repeat(1048576))).toMatchObject({
      ok: false,
      code: 'INVALID_COUNT',
    });
    expect(parseUuidCount('1'.repeat(1048577))).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
    expect(parseUuidCount('é'.repeat(524288) + 'a')).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
  });
  it('não disponibiliza lista parcial quando a fonte falha', () => {
    let calls = 0;
    const result = generateUuids('3', () => {
      calls += 1;
      if (calls === 2) throw new Error('Synthetic failure');
      return uuid;
    });
    expect(result).toMatchObject({ ok: false, code: 'GENERATION_FAILED' });
    expect(result).not.toHaveProperty('value');
    expect(calls).toBe(2);
  });
  it('mantém ordem da fonte sem alegar eliminar colisões', () => {
    let calls = 0;
    const result = generateUuids(
      '3',
      () => uuid.slice(0, -1) + String(++calls),
    );
    expect(result).toEqual({
      ok: true,
      value: [1, 2, 3].map((n) => uuid.slice(0, -1) + String(n)),
    });
  });
  it.each([1, 20])(
    'a fonte nativa produz versão/variante corretas para %i valores',
    (count) => {
      vi.stubGlobal('isSecureContext', true);
      vi.stubGlobal('crypto', nativeCrypto);
      expect(browserUuidAvailable()).toBe(true);
      const result = generateBrowserUuids(String(count));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(count);
        for (const value of result.value) {
          expect(value).toMatch(pattern);
          expect(value[14]).toBe('4');
          expect(['8', '9', 'a', 'b']).toContain(value[19]);
        }
      }
    },
  );
  it('não gera em contexto inseguro mesmo que exista randomUUID', () => {
    const randomUUID = vi.fn(() => uuid);
    vi.stubGlobal('crypto', { randomUUID });
    vi.stubGlobal('isSecureContext', false);
    expect(browserUuidAvailable()).toBe(false);
    expect(generateBrowserUuids('1')).toMatchObject({
      ok: false,
      code: 'UNSUPPORTED_API',
    });
    expect(randomUUID).not.toHaveBeenCalled();
  });
  it.each([undefined, {}])(
    'não usa fallback se a API estiver indisponível',
    (crypto) => {
      vi.stubGlobal('crypto', crypto);
      vi.stubGlobal('isSecureContext', true);
      expect(browserUuidAvailable()).toBe(false);
      expect(generateBrowserUuids('1')).toMatchObject({
        ok: false,
        code: 'UNSUPPORTED_API',
      });
    },
  );
});
