import { useEffect, useRef, useState } from 'react';
import { Copy, Eraser, FlaskConical } from 'lucide-react';
import {
  browserUuidAvailable,
  generateBrowserUuids,
} from '../../lib/tools/uuid';
import { UUID_EXAMPLE_COUNT } from '../../data/uuid-example';

export default function UuidTool() {
  const [count, setCount] = useState('1');
  const [values, setValues] = useState<readonly string[]>([]);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [confirmExample, setConfirmExample] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const manualRef = useRef<HTMLTextAreaElement>(null);
  const exampleRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  const version = useRef(0);
  const copyInFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    setAvailable(browserUuidAvailable());
    setReady(true);
    return () => {
      mounted.current = false;
      version.current += 1;
    };
  }, []);

  function invalidate() {
    version.current += 1;
    setValues([]);
    setError('');
    setStatus('');
    setManual(null);
    setConfirmExample(false);
  }
  function updateCount(value: string) {
    invalidate();
    setCount(value);
  }
  function applyExample() {
    updateCount(UUID_EXAMPLE_COUNT);
    inputRef.current?.focus();
  }
  function generate() {
    invalidate();
    const result = generateBrowserUuids(count);
    if (result.ok) {
      setValues(result.value);
      setStatus(
        result.value.length === 1
          ? '1 UUID gerado.'
          : `${result.value.length} UUIDs gerados.`,
      );
    } else {
      setError(result.message);
      if (result.code === 'UNSUPPORTED_API') setAvailable(false);
    }
  }
  async function copy(value: string, message: string) {
    if (copyInFlight.current) return;
    const currentVersion = version.current;
    copyInFlight.current = true;
    setCopying(true);
    setStatus('');
    setManual(null);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      if (mounted.current && currentVersion === version.current)
        setStatus(message);
    } catch {
      if (mounted.current && currentVersion === version.current) {
        setManual(value);
        setStatus(
          'Não foi possível copiar automaticamente. Selecione o texto para cópia manual e use o comando de copiar do dispositivo.',
        );
      }
    } finally {
      copyInFlight.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  return (
    <section
      className="text-tool-workbench uuid-workbench"
      aria-label="Gerador UUID v4"
    >
      <div className="text-tool-panel">
        <h2>Quantidade</h2>
        <p className="field-help">
          Cada geração substitui a lista anterior. Nada é gerado
          automaticamente.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <label htmlFor="uuid-count">Quantidade de UUIDs</label>
          <input
            id="uuid-count"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={count}
            disabled={!ready}
            onChange={(event) => updateCount(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`uuid-count-help${error ? ' uuid-error' : ''}`}
          />
          <p id="uuid-count-help" className="field-help">
            Inteiro de 1 a 20. Sem espaços, sinais ou zeros à esquerda.
          </p>
          <div className="text-tool-actions text-tool-process-actions">
            <button
              type="submit"
              className="tool-button tool-button-primary"
              disabled={!ready || !available}
            >
              Gerar UUIDs
            </button>
            <button
              type="button"
              className="tool-button"
              disabled={!ready}
              onClick={() => {
                updateCount('1');
                inputRef.current?.focus();
              }}
            >
              <Eraser size={16} aria-hidden="true" /> Limpar
            </button>
            <button
              type="button"
              ref={exampleRef}
              className="tool-button"
              disabled={!ready}
              onClick={() => {
                if (count !== '1' || values.length > 0) setConfirmExample(true);
                else applyExample();
              }}
            >
              <FlaskConical size={16} aria-hidden="true" /> Exemplo: 3 UUIDs
            </button>
          </div>
        </form>
        {confirmExample && (
          <div
            className="example-confirm"
            role="group"
            aria-labelledby="uuid-example-question"
          >
            <p id="uuid-example-question">
              Substituir a quantidade por 3 e descartar a lista atual?
            </p>
            <div className="text-tool-actions">
              <button
                type="button"
                className="tool-button"
                onClick={applyExample}
              >
                Usar exemplo
              </button>
              <button
                type="button"
                className="tool-button"
                onClick={() => {
                  setConfirmExample(false);
                  exampleRef.current?.focus();
                }}
              >
                Manter quantidade
              </button>
            </div>
          </div>
        )}
        {ready && !available && (
          <p className="notice" role="status">
            Geração indisponível: use um contexto seguro (HTTPS ou localhost
            confiável) e um navegador com crypto.randomUUID(). Não há gerador
            alternativo.
          </p>
        )}
        {error && (
          <p id="uuid-error" className="tool-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="text-tool-panel text-tool-result">
        <div className="uuid-result-header">
          <h2>UUIDs gerados</h2>
          <button
            type="button"
            className="tool-button"
            disabled={values.length === 0 || copying}
            aria-busy={copying}
            onClick={() => {
              void copy(values.join('\n'), 'Lista copiada.');
            }}
          >
            <Copy size={16} aria-hidden="true" /> Copiar lista
          </button>
        </div>
        {values.length === 0 ? (
          <p className="field-help">
            Nenhum UUID gerado. Escolha a quantidade e acione Gerar UUIDs.
          </p>
        ) : (
          <ol className="uuid-list" aria-label="Lista de UUIDs gerados">
            {values.map((value, index) => (
              <li key={index}>
                <code>{value}</code>
                <button
                  type="button"
                  className="tool-button"
                  disabled={copying}
                  aria-label={`Copiar UUID ${index + 1}`}
                  onClick={() => {
                    void copy(value, `UUID ${index + 1} copiado.`);
                  }}
                >
                  <Copy size={16} aria-hidden="true" /> Copiar
                </button>
              </li>
            ))}
          </ol>
        )}
        <div
          className="tool-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p>{status}</p>
        </div>
        {manual !== null && (
          <div className="uuid-manual">
            <label htmlFor="uuid-manual">Texto para cópia manual</label>
            <textarea
              id="uuid-manual"
              ref={manualRef}
              readOnly
              value={manual}
              wrap="soft"
              spellCheck={false}
              autoComplete="off"
              translate="no"
            />
            <button
              type="button"
              className="tool-button"
              onClick={() => {
                manualRef.current?.focus();
                manualRef.current?.select();
              }}
            >
              Selecionar texto
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
