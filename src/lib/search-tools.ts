import type { Tool } from '../data/tools';
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}
export function searchTools(
  tools: readonly Tool[],
  query: string,
): readonly Tool[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return tools;
  return tools.filter((tool) => {
    const searchable = normalize(
      [tool.name, tool.category, tool.description, ...tool.keywords].join(' '),
    );
    return terms.every((term) => searchable.includes(term));
  });
}
