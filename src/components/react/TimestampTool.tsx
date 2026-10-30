import TextTool, { type TextToolAction } from './TextTool';
import { TIMESTAMP_EXAMPLE_SECONDS } from '../../data/timestamp-example';
import { convertBrowserTimestamp } from '../../lib/tools/timestamp';

const actions: readonly TextToolAction[] = [
  {
    label: 'Converter segundos',
    success:
      'Segundos convertidos. UTC e fuso do navegador identificados no resultado.',
    transform: (input) => convertBrowserTimestamp(input, 'seconds'),
  },
  {
    label: 'Converter milissegundos',
    success:
      'Milissegundos convertidos. UTC e fuso do navegador identificados no resultado.',
    transform: (input) => convertBrowserTimestamp(input, 'milliseconds'),
  },
];

export default function TimestampTool() {
  return (
    <TextTool
      id="timestamp"
      name="tempo Unix"
      inputLabel="Timestamp Unix de entrada"
      outputLabel="Datas e valores Unix"
      example={TIMESTAMP_EXAMPLE_SECONDS}
      placeholder="Ex.: 1700000000 em segundos ou 1700000000000 em milissegundos."
      outputHelp="UTC em ISO 8601 e horário no fuso do navegador, com deslocamento. A unidade é definida pelo botão acionado."
      outputWrap="soft"
      actions={actions}
    />
  );
}
