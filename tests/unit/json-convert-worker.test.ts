import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  convertInWorker,
  CONVERSION_TIMEOUT_MS,
} from '../../src/lib/json-convert-worker';
import type { ToolResult } from '../../src/types/tool-result';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: ToolResult<string> }) => void) | null = null;
  onerror: ((event: { preventDefault: () => void }) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminated = false;
  request: unknown;
  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(request: unknown) {
    this.request = request;
  }
  terminate() {
    this.terminated = true;
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  FakeWorker.instances = [];
  vi.stubGlobal('Worker', FakeWorker);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('Worker de conversão', () => {
  it('entrega resultado e termina Worker/temporizador', async () => {
    const pending = convertInWorker('{}', 'XML', ',');
    const worker = FakeWorker.instances[0]!;
    expect(worker.request).toEqual({
      input: '{}',
      format: 'XML',
      separator: ',',
    });
    worker.onmessage?.({ data: { ok: true, value: '<json />' } });
    expect(await pending).toEqual({ ok: true, value: '<json />' });
    expect(worker.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cancela imediatamente sem aceitar resposta antiga', async () => {
    const controller = new AbortController();
    const pending = convertInWorker('{}', 'CSV', ';', controller.signal);
    const worker = FakeWorker.instances[0]!;
    controller.abort();
    worker.onmessage?.({ data: { ok: true, value: 'old' } });
    expect(await pending).toMatchObject({
      ok: false,
      code: 'CONVERSION_CANCELLED',
    });
    expect(worker.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('não inicia quando já cancelado', async () => {
    const controller = new AbortController();
    controller.abort();
    expect(
      await convertInWorker('{}', 'CSV', ',', controller.signal),
    ).toMatchObject({ ok: false, code: 'CONVERSION_CANCELLED' });
    expect(FakeWorker.instances).toHaveLength(0);
  });
  it('encerra o trabalho no prazo real definido', async () => {
    const pending = convertInWorker('{}', 'YAML', ',');
    await vi.advanceTimersByTimeAsync(CONVERSION_TIMEOUT_MS - 1);
    expect(FakeWorker.instances[0]!.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toMatchObject({
      ok: false,
      code: 'CONVERSION_TIMEOUT',
    });
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('indisponível não faz conversão na thread principal', async () => {
    vi.stubGlobal('Worker', undefined);
    expect(await convertInWorker('{}', 'XML', ',')).toMatchObject({
      ok: false,
      code: 'WORKER_UNAVAILABLE',
    });
  });
  it('trata construtor, mensagem e execução com erros genéricos sem conteúdo', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('private');
        }
      },
    );
    expect(await convertInWorker('{}', 'XML', ',')).toMatchObject({
      ok: false,
      code: 'WORKER_FAILED',
    });
    vi.stubGlobal('Worker', FakeWorker);
    const pending = convertInWorker('{}', 'XML', ',');
    const preventDefault = vi.fn();
    FakeWorker.instances[0]!.onerror?.({ preventDefault });
    expect(await pending).toMatchObject({ ok: false, code: 'WORKER_FAILED' });
    expect(preventDefault).toHaveBeenCalled();
    const message = convertInWorker('{}', 'XML', ',');
    FakeWorker.instances[1]!.onmessageerror?.();
    expect(await message).toMatchObject({ ok: false, code: 'WORKER_MESSAGE' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
