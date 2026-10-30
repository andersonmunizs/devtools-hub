import TextTool, { type TextToolAction } from './TextTool';
import { BASE64_EXAMPLE_TEXT } from '../../data/base64-example';
import { decodeBase64, encodeBase64 } from '../../lib/tools/base64';

const actions: readonly TextToolAction[] = [
  {
    label: 'Codificar em Base64',
    success: 'Texto codificado em Base64 (UTF-8).',
    transform: encodeBase64,
  },
  {
    label: 'Decodificar para UTF-8',
    success: 'Base64 decodificado para texto UTF-8.',
    transform: decodeBase64,
  },
];

export default function Base64Tool() {
  return (
    <TextTool
      id="base64"
      name="Base64 UTF-8"
      inputLabel="Entrada de texto ou Base64"
      outputLabel="Resultado da conversão"
      example={BASE64_EXAMPLE_TEXT}
      placeholder="Cole texto para codificar ou Base64 padrão para decodificar."
      outputHelp="Saída somente em texto. Base64 usa UTF-8; não cifra nem protege segredos."
      actions={actions}
    />
  );
}
