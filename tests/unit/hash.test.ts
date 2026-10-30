import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sha256, browserHashAvailable } from '../../src/lib/tools/hash';
import {
  HASH_EXAMPLE_TEXT,
  HASH_EXAMPLE_HEX,
  HASH_EMPTY_HEX,
} from '../../src/data/hash-example';

const nativeCrypto = globalThis.crypto;
const reference = (input: string) =>
  createHash('sha256').update(input, 'utf8').digest('hex');
beforeEach(() => {
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('crypto', nativeCrypto);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SHA-256 nativo de texto UTF-8', () => {
  it.each([
    ['', HASH_EMPTY_HEX],
    [HASH_EXAMPLE_TEXT, HASH_EXAMPLE_HEX],
    [
      'hello world',
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    ],
  ])('confere vetor conhecido %j', async (input, value) => {
    expect(await sha256(input)).toEqual({ ok: true, value });
  });
  it('confere vetor conhecido de um milhão de letras a', async () => {
    expect(await sha256('a'.repeat(1000000))).toEqual({
      ok: true,
      value: 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    });
  });
  it.each([
    'Olá, 世界 😀',
    'é',
    'e\u0301',
    '\uFEFFabc',
    'abc\r\n',
    'abc\n',
    '\u0000\t',
    ' abc ',
    '<img onerror=alert(1)>',
    '𐀀',
  ])('compara bytes UTF-8 com referência independente %j', async (input) => {
    const result = await sha256(input);
    expect(result).toEqual({ ok: true, value: reference(input) });
    if (result.ok) expect(result.value).toMatch(/^[0-9a-f]{64}$/);
  });
  it.each([
    ['abc', 'abc\n'],
    ['é', 'e\u0301'],
    ['abc', '\uFEFFabc'],
    ['abc', ' abc'],
    ['a\nb', 'a\r\nb'],
  ])('não normaliza nem remove conteúdo entre %j e %j', async (a, b) => {
    expect(await sha256(a ?? '')).not.toEqual(await sha256(b ?? ''));
  });
  it.each(['\uD800', '\uDC00', 'a\uD800b', '\uD800\uD800'])(
    'rejeita surrogate isolado %j antes do digest',
    async (input) => {
      const digest = vi.spyOn(nativeCrypto.subtle, 'digest');
      expect(await sha256(input)).toMatchObject({
        ok: false,
        code: 'INVALID_UNICODE',
      });
      expect(digest).not.toHaveBeenCalled();
    },
  );
  it.each([
    'a'.repeat(1048575),
    'a'.repeat(1048576),
    'é'.repeat(524288),
    '😀'.repeat(262144),
  ])('aceita fronteira UTF-8 (%#)', async (input) => {
    expect(await sha256(input)).toEqual({ ok: true, value: reference(input) });
  });
  it.each([
    'a'.repeat(1048577),
    'é'.repeat(524288) + 'a',
    '😀'.repeat(262144) + 'a',
  ])('rejeita excesso UTF-8 antes de chamar digest (%#)', async (input) => {
    const digest = vi.spyOn(nativeCrypto.subtle, 'digest');
    expect(await sha256(input)).toMatchObject({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
    expect(digest).not.toHaveBeenCalled();
  });
  it('usa SHA-256 e os bytes exatos com o receptor SubtleCrypto', async () => {
    const digest = vi.spyOn(nativeCrypto.subtle, 'digest');
    await sha256('é😀');
    expect(digest).toHaveBeenCalledWith(
      'SHA-256',
      new Uint8Array([195, 169, 240, 159, 152, 128]),
    );
    expect(digest.mock.contexts[0]).toBe(nativeCrypto.subtle);
  });
  it('retorna falha segura quando digest rejeita, sem resultado parcial', async () => {
    vi.spyOn(nativeCrypto.subtle, 'digest').mockRejectedValue(
      new Error('Synthetic failure'),
    );
    const result = await sha256('dado-sintetico');
    expect(result).toMatchObject({ ok: false, code: 'HASH_FAILED' });
    expect(result).not.toHaveProperty('value');
    if (!result.ok) expect(result.message).not.toContain('dado-sintetico');
  });
  it.each([undefined, {}, { subtle: {} }])(
    'não calcula sem API disponível (%#)',
    async (crypto) => {
      vi.stubGlobal('crypto', crypto);
      expect(browserHashAvailable()).toBe(false);
      expect(await sha256('abc')).toMatchObject({
        ok: false,
        code: 'UNSUPPORTED_API',
      });
    },
  );
  it('não usa API em contexto inseguro nem fallback', async () => {
    vi.stubGlobal('isSecureContext', false);
    const digest = vi.spyOn(nativeCrypto.subtle, 'digest');
    expect(browserHashAvailable()).toBe(false);
    expect(await sha256('abc')).toMatchObject({
      ok: false,
      code: 'UNSUPPORTED_API',
    });
    expect(digest).not.toHaveBeenCalled();
  });
});
