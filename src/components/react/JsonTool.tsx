import TextTool, { type TextToolAction } from './TextTool';
import { JSON_EXAMPLE } from '../../data/json-example';
import { transformJson } from '../../lib/tools/json';

const actions: readonly TextToolAction[] = [
  {
    label: 'Formatar JSON',
    success: 'JSON válido. Resultado formatado com 2 espaços.',
    transform: (input) => transformJson(input, 'format'),
  },
  {
    label: 'Minificar JSON',
    success: 'JSON válido. Resultado minificado.',
    transform: (input) => transformJson(input, 'minify'),
  },
];

export default function JsonTool() {
  return (
    <TextTool
      id="json"
      name="JSON"
      inputLabel="Entrada JSON"
      outputLabel="Resultado JSON"
      example={JSON_EXAMPLE}
      placeholder={'Cole seu JSON aqui. Ex.: {"ativo":true}'}
      outputHelp="Saída em texto. Até 8 MiB, sem truncamento ou execução de conteúdo."
      actions={actions}
    />
  );
}
