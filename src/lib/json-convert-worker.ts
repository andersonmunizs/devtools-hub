import type { ToolResult } from '../types/tool-result';
import type { ConversionFormat, CsvSeparator } from './tools/json-convert';

export const CONVERSION_TIMEOUT_MS = 5_000;
export function convertInWorker(
  input: string,
  format: ConversionFormat,
  separator: CsvSeparator,
  signal?: AbortSignal,
): Promise<ToolResult<string>> {
  return new Promise((resolve) => {
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const settle = (result: ToolResult<string>) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker?.terminate();
      resolve(result);
    };
    const abort = () =>
      settle({
        ok: false,
        code: 'CONVERSION_CANCELLED',
        message: 'Conversão cancelada.',
      });
    if (signal?.aborted) {
      abort();
      return;
    }
    if (typeof Worker === 'undefined') {
      settle({
        ok: false,
        code: 'WORKER_UNAVAILABLE',
        message:
          'Este navegador não disponibiliza Worker. As conversões estão indisponíveis; a formatação JSON continua funcionando.',
      });
      return;
    }
    try {
      worker = new Worker(
        new URL('../workers/json-convert.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.onmessage = (event: MessageEvent<ToolResult<string>>) =>
        settle(event.data);
      worker.onerror = (event) => {
        event.preventDefault();
        settle({
          ok: false,
          code: 'WORKER_FAILED',
          message:
            'Não foi possível iniciar ou concluir o conversor local. Verifique o suporte a Worker e tente novamente.',
        });
      };
      worker.onmessageerror = () =>
        settle({
          ok: false,
          code: 'WORKER_MESSAGE',
          message: 'Não foi possível receber o resultado do conversor local.',
        });
      signal?.addEventListener('abort', abort, { once: true });
      // An actual execution deadline, including module loading, not UI synchronization.
      timer = setTimeout(
        () =>
          settle({
            ok: false,
            code: 'CONVERSION_TIMEOUT',
            message:
              'A conversão excedeu 5 segundos e foi encerrada. Reduza a estrutura e tente novamente.',
          }),
        CONVERSION_TIMEOUT_MS,
      );
      worker.postMessage({ input, format, separator });
    } catch {
      settle({
        ok: false,
        code: 'WORKER_FAILED',
        message: 'Não foi possível iniciar o conversor local neste navegador.',
      });
    }
  });
}
