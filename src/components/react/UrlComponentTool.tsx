import TextTool, { type TextToolAction } from './TextTool';
import { URL_EXAMPLE_TEXT } from '../../data/url-example';
import {
  decodeUrlComponent,
  encodeUrlComponent,
} from '../../lib/tools/url-component';

const actions: readonly TextToolAction[] = [
  {
    label: 'Codificar componente',
    success: 'Componente codificado.',
    transform: encodeUrlComponent,
  },
  {
    label: 'Decodificar componente',
    success: 'Componente decodificado uma vez.',
    transform: decodeUrlComponent,
  },
];

export default function UrlComponentTool() {
  return (
    <TextTool
      id="url"
      name="componente de URL"
      inputLabel="Entrada do componente"
      outputLabel="Resultado da conversão"
      example={URL_EXAMPLE_TEXT}
      placeholder="Cole um componente de URL ou seu texto para converter."
      outputHelp="Somente um componente. Espaço vira %20; + não é tratado como espaço."
      actions={actions}
    />
  );
}
