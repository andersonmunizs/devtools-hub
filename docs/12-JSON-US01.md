# 12 — JSON: primeira fatia funcional (US01)

Data: 2026-10-30. Status: **implementada e validada localmente**. Apenas JSON está habilitado no catálogo. Sem commit, push ou deploy.

Este relatório registra a conclusão original de US01. A evolução seguinte adiciona Base64 e extrai o editor compartilhado, com regressão JSON, em [13 — Base64/US02](13-BASE64-US02.md).

## Entrega e critérios de aceite

Página `/ferramentas/json/` com título/descrição indexáveis, conteúdo estático Astro e editor React. Valida e serializa objetos, arrays e primitivos usando `JSON.parse`/`JSON.stringify`, com dois espaços ou minificação. A saída é texto em textarea somente leitura; conteúdo nunca é executado.

Exemplo deliberadamente sintético em `src/data/json-example.ts`. Aplicá-lo a uma entrada preenchida exige confirmação inline; cancelar preserva entrada e resultado. Limpar redefine entrada, saída, erros e feedback, com foco de volta ao campo. Editar invalida a saída anterior imediatamente.

Erros distinguem entrada vazia, sintaxe inválida, excesso de entrada, expansão da saída e limite nativo de profundidade/recursos. A entrada é preservada; nunca há correção silenciosa, saída parcial ou posição de erro inventada. Mensagens de exceções nativas não são exibidas ou registradas com trechos de conteúdo.

Copiar depende de clique/teclado, é desabilitado sem resultado válido e anuncia sucesso/falha. Se a API estiver indisponível ou bloqueada, é oferecida seleção manual. Uma cópia pendente não restaura feedback ou saída após editar/limpar. O navegador controla a operação de clipboard já iniciada; limpar a ferramenta não apaga a área de transferência do sistema.

## Limites e semântica documentados

- Entrada máxima de **1 MiB = 1.048.576 bytes UTF-8**, validada antes do parse. O contador informa excesso e bloqueia ações; a função pura valida novamente. Para strings cujo tamanho UTF-16 já excede o orçamento, não aloca um buffer UTF-8 apenas para confirmar excesso.
- Saída máxima de **8 MiB = 8.388.608 bytes UTF-8**, aprovada pela pessoa responsável na [ADR-0007](adr/0007-orcamento-de-saida-json.md). O replacer retorna valores inalterados e contabiliza a serialização nativa, inclusive escapes, chaves, separadores e indentação; lança erro interno antes de construir resultado excessivo.
- Nenhum processamento a cada tecla, além da contagem de tamanho necessária à UI. Sem Worker ou timer de sincronização; sem dependências novas ou mudança de CSP.
- Ordem/precisão seguem as APIs nativas: chaves numéricas podem mudar de ordem; duplicadas mantêm o último valor; números grandes podem arredondar, `-0` vira `0` e overflow numérico pode resultar em `null`. Essas limitações estão explicadas na página; valores que exigem dígitos exatos devem ser strings no JSON original.
- Unicode/escapes seguem as APIs nativas. Surrogates isolados são escapados na saída; o contador usa a contagem UTF-8 do `TextEncoder` (substituição desses casos apenas na medição, sem alterar o texto).
- Estruturas profundas podem atingir limites diferentes entre motores. Nesses casos há erro de recursos, não uma alegação de sintaxe inválida. Não foi inventado limite universal de profundidade.

Referências de comportamento consultadas: [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse), [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) e [Clipboard.writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText). Os testes usam também saídas esperadas explícitas e comparação com APIs nativas, sem depender apenas de snapshots.

## Verificações executadas

Ambiente: Windows, Node 24.22.2, pnpm 11.25.0, Astro 7.4.4. Execução dos E2E sobre o build estático servido por `preview`.

| Verificação                      | Resultado real                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS, sem alteração de dependências                                                                                     |
| `pnpm lint`                      | PASS, sem warnings                                                                                                      |
| `pnpm format:check`              | PASS no escopo configurado; alterações pontuais nas especificações revisadas manualmente                                |
| `pnpm typecheck`                 | PASS, Astro check com 0 erros/warnings/hints e `tsc --noEmit`                                                           |
| `pnpm test:unit`                 | PASS, **48 testes**, incluindo busca e JSON                                                                             |
| `pnpm build`                     | PASS, 4 páginas estáticas                                                                                               |
| `pnpm test:e2e`                  | PASS, **71 aprovados e 1 explicitamente não executado**, de 72 casos; 35,6 s na execução final                          |
| `pnpm audit --audit-level high`  | PASS, sem vulnerabilidades conhecidas                                                                                   |
| Inspeção de fonte/diff           | Sem APIs de envio de conteúdo, execução arbitrária, inserção HTML ou logging de input na produção; whitespace sem erros |

O caso não executado é a **leitura automatizada do clipboard real em Firefox**, por diferença no suporte a permissões do runner. A cópia real foi validada em Chromium desktop e emulação mobile Chromium. Sucesso controlado, bloqueio/fallback e cópia pendente foram testados em todos os projetos. Isso não é alegação de teste de clipboard nativo Firefox.

Os testes unitários cobrem `{}`, `[]`, strings, booleanos, números e `null`; Unicode/emoji, escapes e surrogates; chaves `__proto__`/`constructor`/`toJSON`, HTML como texto, duplicadas e chaves numéricas; erros em várias posições; entradas ASCII e multibyte exatamente no limite e acima; resultado exato de 8 MiB e um byte acima em arrays e objetos com chaves Unicode/escapadas; expansão patológica e excesso de profundidade.

Os E2E comprovam catálogo → busca → JSON → formatar/minificar → copiar → limpar; estados vazios e erros com preservação; invalidação imediata; confirmação do exemplo; clipboard bloqueado/pendente; XSS/prototype pollution; tamanho de entrada/expansão; teclado, modo sem JavaScript, mobile e temas. Sem JavaScript, os controles de processamento ficam desabilitados e há aviso explícito; os links do catálogo e explicações continuam disponíveis.

## Rede, storage, CSP e acessibilidade

O fluxo com payload sintético hostil não gerou requisições ao processar; o conteúdo permaneceu fora de URL, localStorage, sessionStorage, IndexedDB e cookies. Recarregar não restaurou entrada ou saída pelo aplicativo. A preferência de tema continua sendo a única persistência intencional. Atualizada a página de privacidade para descrever JSON e clipboard.

CSP do build mantém `connect-src 'none'`, restrição a objetos e hashes de execução, sem liberação genérica de inline/eval. Hidratação, tema e ferramenta funcionam nos testes; console sem erros no fluxo de privacidade. Não houve alteração em `astro.config.mjs`, headers, stack ou dependências nesta fatia.

Axe passou nos dois temas, nas páginas da base e nos estados vazio/sucesso/erro do JSON. A primeira rodada detectou um link interno distinguível apenas pela cor; foi corrigido com sublinhado, mantendo as regras e testes. Também foi corrigido um escape redundante em fixture apontado pelo lint.

Fluxos de teclado automatizados verificam foco/skip link, ação Enter/Space, entrada → ações → resultado e seleção manual. Layout sem overflow da página em 320/375/768/1024/1440 px, inclusive conteúdo longo; rolagem horizontal fica dentro dos campos. Capturas reais desktop/mobile, temas claro/escuro e erro foram inspecionadas em `test-results/json-JSON-responsivo-e-capturas-reais-inclusive-saída-longa-chromium/`. Relatório E2E em `playwright-report/index.html`; artefatos locais ignorados pelo Git.

## Medições locais e riscos residuais

Medições separadas com Node 24.22.2, dados sintéticos e `performance.now`, sem renderização e sem alegação de INP/Core Web Vitals:

| Caso                                              |         Entrada | Saída / estado                                   | Formatar | Minificar |
| ------------------------------------------------- | --------------: | ------------------------------------------------ | -------: | --------: |
| String ASCII no limite                            | 1.048.576 bytes | 1.048.576 bytes                                  |     4 ms |      3 ms |
| Array de 524.287 zeros                            | 1.048.575 bytes | 2.621.437 bytes formatados / 1.048.575 compactos |    99 ms |     98 ms |
| Estrutura com 1.024 níveis externos e 5.001 zeros |    12.051 bytes | Erro de saída ao formatar / minificação válida   |    13 ms |      2 ms |

A contagem inicial alocava buffer UTF-8 por número e levou aproximadamente 757–945 ms no array grande. A otimização usa o comprimento ASCII desses literais, preservando a contagem UTF-8 para chaves/strings; os testes de fronteira continuaram passando. Os tempos finais acima variam com máquina/carga; não garantem responsividade em todo aparelho. Limites de bytes e captura de falhas nativas não são sandbox nem garantia de tempo/memória máximos do motor.

O chunk específico do editor emitido neste build tem **7.535 bytes**, gzip local **3.017 bytes**, além do runtime React e do chunk compartilhado de JSX/ícones. Não há dependência nova. O CSS da ferramenta pode ser emitido inline pelo Astro e é coberto pela CSP; esses números não representam transferência total em produção.

Leitor de tela, zoom manual do navegador, Lighthouse, dispositivos físicos/Safari, sessões moderadas com usuários, CI remoto e HTTPS/headers reais: **NOT RUN** nesta fatia. Axe e emulação não substituem essas avaliações. Sem auditoria formal OWASP ou garantia de privacidade absoluta; clipboard, extensões e retenção pelo navegador/sistema possuem os limites descritos na página.

## Arquivos e próximo incremento

Novos: `src/types/tool-result.ts`, `src/lib/tools/json.ts`, `src/data/json-example.ts`, `src/components/react/JsonTool.tsx`, `src/styles/json-tool.css`, `tests/unit/json.test.ts`, `tests/e2e/json.spec.ts`, `docs/adr/0007-orcamento-de-saida-json.md` e este relatório.

Atualizados: `src/pages/ferramentas/json.astro`, `src/pages/index.astro`, `src/pages/privacidade.astro`, `src/data/tools.ts`, `src/components/react/SearchTools.tsx`, testes existentes de busca/base, `README.md`, `docs/02`, `docs/05`, `docs/09` e nota histórica em `docs/11`. A marcação do card foi ajustada para um container de bloco ao receber título/descrição reais, sem interação aninhada. Os arquivos de partida continuam não rastreados; `git diff` comum não enumera todos os novos arquivos, por isso também foi feita checagem explícita com `--no-index`.

**Próximo incremento:** P3.1/US02, Base64 ↔ UTF-8, uma fatia separada com erros, Unicode, limites e testes próprios. Nenhuma outra ferramenta foi implementada nesta tarefa. Publicação continua dependendo dos critérios de release e de autorização explícita.
