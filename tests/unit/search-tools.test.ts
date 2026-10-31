import { describe, expect, it } from 'vitest';
import type { Tool } from '../../src/data/tools';
import { publishedTools } from '../../src/data/tools';
import { searchTools } from '../../src/lib/search-tools';

// Synthetic fixture, never registered as a published tool.
const tools: readonly Tool[] = [
  {
    slug: 'example-json',
    name: 'Exemplo JSON',
    description: 'Formatar dados sintéticos',
    category: 'Dados',
    keywords: ['validar'],
  },
  {
    slug: 'example-time',
    name: 'Exemplo de tempo',
    description: 'Converter unidades',
    category: 'Datas',
    keywords: ['timestamp'],
  },
];

describe('busca local do catálogo', () => {
  it.each(['csv', 'xml', 'yaml'])(
    'encontra a conversão JSON para %s',
    (format) => {
      expect(
        searchTools(publishedTools, `json para ${format}`).map(
          (tool) => tool.slug,
        ),
      ).toEqual(['json']);
    },
  );
  it('encontra tarefas com várias palavras e sem acentos', () => {
    expect(
      searchTools(publishedTools, 'formatar json').map((tool) => tool.slug),
    ).toEqual(['json']);
    expect(
      searchTools(publishedTools, 'converter data').map((tool) => tool.slug),
    ).toEqual(['timestamp']);
    expect(
      searchTools(publishedTools, 'parametro url').map((tool) => tool.slug),
    ).toEqual(['url']);
    expect(searchTools(publishedTools, 'json inexistente')).toEqual([]);
  });
  it('publica somente JSON, Base64, URL, tempo Unix, UUID e SHA-256 e encontra termos alternativos', () => {
    expect(publishedTools.map((tool) => tool.slug)).toEqual([
      'json',
      'base64',
      'url',
      'timestamp',
      'uuid',
      'hash',
    ]);
    const json = publishedTools.filter((tool) => tool.slug === 'json');
    const base64 = publishedTools.filter((tool) => tool.slug === 'base64');
    expect(searchTools(publishedTools, 'JSON')).toEqual(json);
    expect(searchTools(publishedTools, 'pretty print')).toEqual(json);
    expect(searchTools(publishedTools, 'Base64')).toEqual(base64);
    expect(searchTools(publishedTools, 'Unicode')).toEqual(base64);
    expect(
      searchTools(publishedTools, 'percent-encoding').map((tool) => tool.slug),
    ).toEqual(['url']);
    expect(
      searchTools(publishedTools, 'epoch').map((tool) => tool.slug),
    ).toEqual(['timestamp']);
    expect(
      searchTools(publishedTools, 'UUID').map((tool) => tool.slug),
    ).toEqual(['uuid']);
    expect(
      searchTools(publishedTools, 'GUID').map((tool) => tool.slug),
    ).toEqual(['uuid']);
    expect(
      searchTools(publishedTools, 'SHA-256').map((tool) => tool.slug),
    ).toEqual(['hash']);
    expect(
      searchTools(publishedTools, 'checksum').map((tool) => tool.slug),
    ).toEqual(['hash']);
  });
  it('aceita vazio e espaços sem descartar ferramentas', () => {
    expect(searchTools(tools, '  ')).toEqual(tools);
  });
  it('encontra nome sem distinguir caixa e remove espaços externos', () => {
    expect(searchTools(tools, '  jSoN ')).toEqual([tools[0]]);
  });
  it('busca por termo alternativo, descrição e categoria', () => {
    expect(searchTools(tools, 'VALIDAR')).toEqual([tools[0]]);
    expect(searchTools(tools, 'unidades')).toEqual([tools[1]]);
    expect(searchTools(tools, 'Datas')).toEqual([tools[1]]);
  });
  it('trata Unicode e texto hostil como dados sem interpretar expressão regular', () => {
    expect(searchTools(tools, '<img onerror=alert(1)>')).toEqual([]);
    expect(searchTools(tools, '.*')).toEqual([]);
    expect(searchTools(tools, '😀')).toEqual([]);
    expect(searchTools(tools, 'sintéticos')).toEqual([tools[0]]);
  });
  it('não altera o catálogo ou seus metadados', () => {
    const before = structuredClone(tools);
    searchTools(tools, 'json');
    expect(tools).toEqual(before);
  });
});
