import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Eraser, FlaskConical } from 'lucide-react';
import { getTextInputSize, TEXT_INPUT_LIMIT_BYTES } from '../../lib/text-input';
import type { ToolResult } from '../../types/tool-result';

export interface TextToolAction {
  label: string;
  success: string;
  transform: (
    input: string,
  ) => ToolResult<string> | Promise<ToolResult<string>>;
  pendingMessage?: string;
}
interface Props {
  id: string;
  name: string;
  inputLabel: string;
  outputLabel: string;
  example: string;
  placeholder: string;
  outputHelp: string;
  outputWrap?: 'off' | 'soft';
  unavailableMessage?: string;
  actions: readonly TextToolAction[];
}

const numbers = new Intl.NumberFormat('pt-BR');

export default function TextTool({
  id,
  name,
  inputLabel,
  outputLabel,
  example,
  placeholder,
  outputHelp,
  outputWrap = 'off',
  unavailableMessage = '',
  actions,
}: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [copyError, setCopyError] = useState(false);
  const [copying, setCopying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmExample, setConfirmExample] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const exampleRef = useRef<HTMLButtonElement>(null);
  const version = useRef(0);
  const mounted = useRef(false);
  const copyInFlight = useRef(false);
  const processingInFlight = useRef(false);
  const inputBytes = useMemo(() => getTextInputSize(input), [input]);
  const oversized = inputBytes === null || inputBytes > TEXT_INPUT_LIMIT_BYTES;

  useEffect(() => {
    mounted.current = true;
    setReady(true);
    return () => {
      mounted.current = false;
      version.current += 1;
    };
  }, []);

  function invalidate() {
    version.current += 1;
    setOutput(null);
    setError('');
    setStatus('');
    setCopyError(false);
    setConfirmExample(false);
  }
  function updateInput(value: string) {
    invalidate();
    setInput(value);
  }
  async function run(action: TextToolAction) {
    if (processingInFlight.current) return;
    invalidate();
    const currentVersion = version.current;
    try {
      const pending = action.transform(input);
      let result: ToolResult<string>;
      if (pending instanceof Promise) {
        processingInFlight.current = true;
        setProcessing(true);
        setStatus(action.pendingMessage ?? 'Processando…');
        result = await pending;
      } else result = pending;
      if (!mounted.current || currentVersion !== version.current) return;
      if (result.ok) {
        setOutput(result.value);
        setStatus(
          action.success +
            (result.value === '' ? ' O resultado vazio é válido.' : ''),
        );
      } else {
        setStatus('');
        setError(result.message);
      }
    } catch {
      if (mounted.current && currentVersion === version.current) {
        setStatus('');
        setError(
          'Não foi possível processar neste navegador. Tente novamente.',
        );
      }
    } finally {
      processingInFlight.current = false;
      if (mounted.current) setProcessing(false);
    }
  }
  function applyExample() {
    updateInput(example);
    inputRef.current?.focus();
  }
  async function copyOutput() {
    if (output === null || copyInFlight.current) return;
    const currentVersion = version.current;
    copyInFlight.current = true;
    setCopying(true);
    setStatus('');
    setCopyError(false);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(output);
      if (mounted.current && version.current === currentVersion)
        setStatus('Resultado copiado.');
    } catch {
      if (mounted.current && version.current === currentVersion) {
        setCopyError(true);
        setStatus(
          'Não foi possível copiar automaticamente. Selecione o resultado e use o comando de copiar do seu dispositivo.',
        );
      }
    } finally {
      copyInFlight.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  return (
    <section className="text-tool-workbench" aria-label={`Editor ${name}`}>
      <div className="text-tool-panel text-tool-entry">
        <div className="text-tool-panel-header">
          <h2>
            <label htmlFor={`${id}-input`}>{inputLabel}</label>
          </h2>
          <div className="text-tool-actions">
            <button
              type="button"
              className="tool-button tool-button-subtle"
              ref={exampleRef}
              disabled={!ready}
              onClick={() => {
                if (input.length > 0) setConfirmExample(true);
                else applyExample();
              }}
            >
              <FlaskConical size={16} aria-hidden="true" /> Exemplo sintético
            </button>
            <button
              type="button"
              className="tool-button tool-button-subtle"
              disabled={
                !ready || (!input && output === null && !error && !processing)
              }
              onClick={() => {
                updateInput('');
                inputRef.current?.focus();
              }}
            >
              <Eraser size={16} aria-hidden="true" /> Limpar
            </button>
          </div>
        </div>
        {confirmExample && (
          <div
            className="example-confirm"
            role="group"
            aria-labelledby={`${id}-example-question`}
          >
            <p id={`${id}-example-question`}>
              Substituir a entrada atual pelo exemplo sintético?
            </p>
            <div className="text-tool-actions">
              <button
                type="button"
                className="tool-button"
                onClick={applyExample}
              >
                Substituir entrada
              </button>
              <button
                type="button"
                className="tool-button"
                onClick={() => {
                  setConfirmExample(false);
                  exampleRef.current?.focus();
                }}
              >
                Manter entrada
              </button>
            </div>
          </div>
        )}
        <textarea
          id={`${id}-input`}
          ref={inputRef}
          value={input}
          disabled={!ready}
          onChange={(event) => updateInput(event.target.value)}
          aria-invalid={Boolean(error) || oversized}
          aria-describedby={`${id}-input-help${error ? ` ${id}-error` : ''}`}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          translate="no"
          wrap="off"
          placeholder={placeholder}
        />
        <p
          id={`${id}-input-help`}
          className={oversized ? 'field-help input-over-limit' : 'field-help'}
        >
          {inputBytes === null
            ? 'Entrada acima de 1 MiB.'
            : `${numbers.format(inputBytes)} ${inputBytes === 1 ? 'byte' : 'bytes'} UTF-8 de 1.048.576 permitidos.`}
          {oversized && ' Reduza o texto para processar.'}
        </p>
        <div className="text-tool-actions text-tool-process-actions">
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              className={
                index === 0 ? 'tool-button tool-button-primary' : 'tool-button'
              }
              disabled={
                !ready || oversized || processing || Boolean(unavailableMessage)
              }
              aria-busy={processing}
              onClick={() => {
                void run(action);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
        {unavailableMessage && (
          <p className="notice" role="status">
            {unavailableMessage}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="tool-error">
            {error}
          </p>
        )}
      </div>
      <div className="text-tool-panel text-tool-result">
        <div className="text-tool-panel-header">
          <h2>
            <label htmlFor={`${id}-output`}>{outputLabel}</label>
          </h2>
          <button
            type="button"
            className="tool-button"
            disabled={output === null || copying}
            aria-busy={copying}
            onClick={() => {
              void copyOutput();
            }}
          >
            {status === 'Resultado copiado.' ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            {copying ? 'Copiando…' : 'Copiar resultado'}
          </button>
        </div>
        <textarea
          id={`${id}-output`}
          ref={outputRef}
          value={output ?? ''}
          readOnly
          aria-describedby={`${id}-output-help`}
          spellCheck={false}
          autoComplete="off"
          translate="no"
          wrap={outputWrap}
          placeholder="O resultado aparecerá aqui após processar."
        />
        <p id={`${id}-output-help`} className="field-help">
          {outputHelp}
        </p>
        <div
          className="tool-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p>{status}</p>
        </div>
        {copyError && output !== null && (
          <button
            type="button"
            className="tool-button"
            onClick={() => {
              outputRef.current?.focus();
              outputRef.current?.select();
            }}
          >
            Selecionar resultado
          </button>
        )}
      </div>
    </section>
  );
}
