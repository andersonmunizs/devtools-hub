import { useEffect, useState } from 'react';
import TextTool, { type TextToolAction } from './TextTool';
import { HASH_EXAMPLE_TEXT } from '../../data/hash-example';
import {
  browserHashAvailable,
  HASH_UNAVAILABLE_MESSAGE,
  sha256,
} from '../../lib/tools/hash';

const actions: readonly TextToolAction[] = [
  {
    label: 'Calcular SHA-256',
    success: 'SHA-256 calculado sobre os bytes UTF-8 da entrada.',
    pendingMessage: 'Calculando SHA-256…',
    transform: sha256,
  },
];

export default function HashTool() {
  const [unavailableMessage, setUnavailableMessage] = useState('');
  useEffect(() => {
    setUnavailableMessage(
      browserHashAvailable() ? '' : HASH_UNAVAILABLE_MESSAGE,
    );
  }, []);
  return (
    <TextTool
      id="hash"
      name="SHA-256"
      inputLabel="Texto de entrada UTF-8"
      outputLabel="Hash SHA-256 em hexadecimal"
      example={HASH_EXAMPLE_TEXT}
      placeholder="Cole o texto exato, incluindo os espaços e quebras de linha desejados."
      outputHelp="64 caracteres hexadecimais em minúsculas. Hash não cifra o texto."
      outputWrap="soft"
      unavailableMessage={unavailableMessage}
      actions={actions}
    />
  );
}
