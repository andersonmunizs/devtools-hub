# Componentes de terceiros

O repositório referencia dependências pelo pnpm e lockfile; a licença do projeto não substitui as licenças desses componentes.

Metadados dos pacotes instalados, conferidos em 30/10/2026:

| Componente                       | Versão | Licença declarada | Uso                                                       |
| -------------------------------- | ------ | ----------------- | --------------------------------------------------------- |
| Astro                            | 7.4.4  | MIT               | Build estático                                            |
| @astrojs/react                   | 7.1.2  | MIT               | Integração de ilhas                                       |
| React / React DOM                | 19.3.1 | MIT               | Controles interativos                                     |
| Lucide React                     | 1.64.0 | ISC               | Ícones SVG                                                |
| Tailwind CSS / @tailwindcss/vite | 4.3.3  | MIT               | Estilos/build                                             |
| yaml                             | 2.9.1  | ISC               | Serialização YAML no Worker local, sob demanda (ADR-0009) |

O lockfile inclui transitivas e ferramentas de desenvolvimento. Esta tabela cobre componentes centrais e não declara que todas as transitivas têm a mesma licença. Antes de redistribuir um bundle, preservar os avisos aplicáveis dos pacotes incluídos e revisar mudanças de licença em atualizações. Textos originais acompanham os pacotes instalados; não remover avisos do código gerado.

Lighthouse, usado em auditoria local, é Apache-2.0 e não integra as dependências do aplicativo. Relatórios e binários locais ficam fora do repositório público.

O aviso ISC completo de yaml acompanha o código em `public/licenses/yaml.txt`, copiado do pacote instalado, e é distribuído como `licenses/yaml.txt` no artefato estático. A dependência direta foi aprovada na ADR-0009; não é um serviço externo. O serializador é carregado em chunk local sob demanda no Worker, com impacto medido no relatório de conversões.
