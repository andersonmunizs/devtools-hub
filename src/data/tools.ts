export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: string;
  keywords: readonly string[];
}

// Only complete tools belong in the catalog.
export const publishedTools: readonly Tool[] = [
  {
    slug: 'json',
    name: 'Validador e formatador JSON',
    description:
      'Valide, organize com dois espaços ou minifique JSON no navegador.',
    category: 'Dados e formatos',
    keywords: ['validar', 'formatar', 'minificar', 'pretty print', 'compactar'],
  },
  {
    slug: 'base64',
    name: 'Base64 ↔ UTF-8',
    description:
      'Codifique texto Unicode e decodifique Base64 padrão para UTF-8.',
    category: 'Dados e formatos',
    keywords: [
      'codificar',
      'decodificar',
      'unicode',
      'texto',
      'converter',
      'encode',
      'decode',
    ],
  },
  {
    slug: 'url',
    name: 'Componente de URL',
    description:
      'Codifique e decodifique partes de URL com UTF-8 e percent-encoding.',
    category: 'Dados e formatos',
    keywords: [
      'codificar',
      'decodificar',
      'encodeURIComponent',
      'decodeURIComponent',
      'uri',
      'query',
      'converter',
      'parâmetro',
    ],
  },
  {
    slug: 'timestamp',
    name: 'Conversor de tempo Unix',
    description:
      'Converta segundos ou milissegundos para UTC e horário no fuso do navegador.',
    category: 'Datas e tempo',
    keywords: [
      'timestamp',
      'epoch',
      'data',
      'fuso',
      'unix',
      'converter',
      'data',
      'horário',
    ],
  },
  {
    slug: 'uuid',
    name: 'Gerador UUID v4',
    description:
      'Gere de 1 a 20 UUIDs v4 com Web Crypto e copie um ou toda a lista.',
    category: 'Identificadores',
    keywords: ['guid', 'randomUUID', 'identificador', 'gerar'],
  },
  {
    slug: 'hash',
    name: 'SHA-256 de texto UTF-8',
    description:
      'Calcule SHA-256 de texto UTF-8 com Web Crypto e copie o hash hexadecimal.',
    category: 'Hashes',
    keywords: ['sha256', 'digest', 'hash', 'checksum', 'calcular', 'sha 256'],
  },
];
