import { convertJson } from '../lib/tools/json-convert';
interface Request {
  input: string;
  format: 'CSV' | 'XML' | 'YAML';
  separator: ',' | ';';
}
self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  if (
    !request ||
    typeof request.input !== 'string' ||
    !['CSV', 'XML', 'YAML'].includes(request.format) ||
    ![',', ';'].includes(request.separator)
  ) {
    self.postMessage({
      ok: false,
      code: 'CONVERSION_REQUEST',
      message: 'Configuração de conversão inválida.',
    });
    return;
  }
  self.postMessage(
    await convertJson(request.input, request.format, request.separator),
  );
};
