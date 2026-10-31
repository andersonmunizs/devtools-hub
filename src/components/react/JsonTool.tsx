import TextTool, { type TextToolAction } from './TextTool';
import { JSON_EXAMPLE } from '../../data/json-example';
import { transformJson } from '../../lib/tools/json';
import { useState } from 'react';
import JsonOutputActions from './JsonOutputActions';
import { convertInWorker } from '../../lib/json-convert-worker';
import type {
  ConversionFormat,
  CsvSeparator,
} from '../../lib/tools/json-convert';

export default function JsonTool() {
  const [indentation, setIndentation] = useState<2 | 3 | 4>(2);
  const [conversion, setConversion] = useState<ConversionFormat>('CSV');
  const [separator, setSeparator] = useState<CsvSeparator>(',');
  const actions: readonly TextToolAction[] = [
    {
      label: 'Formatar JSON',
      success: `JSON válido. Resultado formatado com ${indentation} espaços.`,
      transform: (input) => transformJson(input, 'format', indentation),
    },
    {
      label: 'Minificar JSON',
      success: 'JSON válido. Resultado minificado.',
      transform: (input) => transformJson(input, 'minify'),
    },
    {
      label: 'Validar JSON',
      success: 'JSON válido. Texto original preservado no resultado.',
      transform: (input) => transformJson(input, 'validate'),
    },
    {
      label: `Converter para ${conversion}`,
      success: `Conversão para ${conversion} concluída.`,
      pendingMessage: `Convertendo para ${conversion} no Worker local…`,
      cancellable: true,
      outputFormat: conversion,
      transform: (input, signal) =>
        convertInWorker(input, conversion, separator, signal),
    },
  ];

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
      inputControls={
        <div className="json-settings">
          <label className="json-indentation">
            Indentação
            <select
              aria-label="Indentação JSON"
              value={indentation}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value === 2 || value === 3 || value === 4)
                  setIndentation(value);
              }}
            >
              <option value={2}>2 espaços</option>
              <option value={3}>3 espaços</option>
              <option value={4}>4 espaços</option>
            </select>
          </label>
          <label className="json-indentation">
            Formato de conversão
            <select
              aria-label="Formato de conversão"
              value={conversion}
              onChange={(event) => {
                const value = event.target.value;
                if (value === 'CSV' || value === 'XML' || value === 'YAML')
                  setConversion(value);
              }}
            >
              <option>CSV</option>
              <option>XML</option>
              <option>YAML</option>
            </select>
          </label>
          {conversion === 'CSV' && (
            <label className="json-indentation">
              Separador CSV
              <select
                aria-label="Separador CSV"
                value={separator}
                onChange={(event) => {
                  if (event.target.value === ',' || event.target.value === ';')
                    setSeparator(event.target.value);
                }}
              >
                <option value=",">Vírgula</option>
                <option value=";">Ponto e vírgula</option>
              </select>
            </label>
          )}
          <p className="field-help">
            {conversion === 'CSV'
              ? 'CSV aceita objeto ou lista de objetos. Null e campos ausentes viram vazios; objetos internos viram JSON compacto. Textos que possam virar fórmulas são rejeitados. Importe como texto em planilhas.'
              : conversion === 'XML'
                ? 'XML tipado: raiz json, tags entry/item e atributo type. Não corresponde automaticamente ao schema de uma API.'
                : 'YAML 1.2 com strings e chaves entre aspas, sem aliases nem inferência de datas.'}
          </p>
          <p className="field-help">
            Conversões: até 128 níveis e 50.000 valores; prazo de 5 segundos.
            Números seguem a precisão JavaScript; use strings para preservar
            dígitos exatos. Alterar opções não reconverte o resultado.
          </p>
        </div>
      }
      outputActions={(output, copy) => (
        <JsonOutputActions value={output} {...copy} />
      )}
    />
  );
}
