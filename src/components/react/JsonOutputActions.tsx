import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';

export default function JsonOutputActions({
  value,
  onCopy,
  copying,
  status,
  onNotice,
  format = 'JSON',
}: {
  value: string | null;
  onCopy: () => void;
  copying: boolean;
  status: string;
  onNotice: (message: string) => void;
  format?: 'JSON' | 'CSV' | 'XML' | 'YAML';
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const text = useRef<HTMLTextAreaElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [wrap, setWrap] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [expanded]);
  useEffect(() => {
    setFeedback('');
  }, [value]);

  function download() {
    if (value === null) return;
    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;
    try {
      const file = {
        JSON: { extension: 'json', mime: 'application/json' },
        CSV: { extension: 'csv', mime: 'text/csv' },
        XML: { extension: 'xml', mime: 'application/xml' },
        YAML: { extension: 'yaml', mime: 'application/yaml' },
      }[format];
      url = URL.createObjectURL(
        new Blob([value], { type: `${file.mime};charset=utf-8` }),
      );
      link = document.createElement('a');
      link.href = url;
      link.download = `resultado.${file.extension}`;
      document.body.append(link);
      link.click();
      const message =
        'Download solicitado. O arquivo será salvo pelo navegador.';
      setFeedback(message);
      onNotice(message);
    } catch {
      const message =
        'Não foi possível baixar. Use Copiar resultado ou selecione o texto.';
      setFeedback(message);
      onNotice(message);
    } finally {
      link?.remove();
      if (url) URL.revokeObjectURL(url);
    }
  }

  return (
    <>
      <button
        type="button"
        className="tool-button"
        disabled={value === null}
        onClick={() => {
          setFeedback('');
          setExpanded(true);
          dialog.current?.showModal();
        }}
      >
        <Maximize2 size={16} aria-hidden="true" /> Tela cheia
      </button>
      <button
        type="button"
        className="tool-button"
        disabled={value === null}
        onClick={download}
      >
        <Download size={16} aria-hidden="true" /> Baixar {format}
      </button>
      <dialog
        ref={dialog}
        className="json-expanded"
        aria-labelledby="json-expanded-title"
        onClose={() => setExpanded(false)}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          if (event.shiftKey && document.activeElement === close.current) {
            event.preventDefault();
            text.current?.focus();
          } else if (
            !event.shiftKey &&
            document.activeElement === text.current
          ) {
            event.preventDefault();
            close.current?.focus();
          }
        }}
      >
        <div className="json-expanded-header">
          <h2 id="json-expanded-title">Resultado {format} em tela cheia</h2>
          <button
            type="button"
            className="tool-button"
            autoFocus
            ref={close}
            onClick={() => dialog.current?.close()}
          >
            <X size={16} aria-hidden="true" /> Fechar tela cheia
          </button>
        </div>
        <div className="text-tool-actions">
          <label className="json-wrap">
            <input
              type="checkbox"
              checked={wrap}
              onChange={(event) => setWrap(event.target.checked)}
            />{' '}
            Quebrar linhas
          </label>
          <button
            type="button"
            className="tool-button"
            onClick={() => {
              setFeedback('');
              onCopy();
            }}
            disabled={copying || value === null}
          >
            {copying ? 'Copiando…' : `Copiar ${format}`}
          </button>
          <button
            type="button"
            className="tool-button"
            onClick={() => {
              text.current?.focus();
              text.current?.select();
              setFeedback(
                'Texto selecionado. Use o comando de copiar do seu dispositivo.',
              );
            }}
          >
            Selecionar {format}
          </button>
          <button
            type="button"
            className="tool-button"
            onClick={download}
            disabled={value === null}
          >
            Baixar {format}
          </button>
        </div>
        <label htmlFor="json-expanded-output">
          Resultado {format} expandido
        </label>
        <textarea
          id="json-expanded-output"
          ref={text}
          value={expanded ? (value ?? '') : ''}
          readOnly
          wrap={wrap ? 'soft' : 'off'}
          spellCheck={false}
          autoComplete="off"
          translate="no"
        />
        <p className="field-help">
          Esc fecha esta visualização. Quebrar linhas não altera o conteúdo.
        </p>
        <p role="status" aria-live="polite">
          {feedback || status}
        </p>
      </dialog>
    </>
  );
}
