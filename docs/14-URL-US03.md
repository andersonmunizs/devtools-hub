# 14 — Componente de URL (US03)

> Registro histórico da fatia US03. A próxima entrega está em [15 — Unix/US04](15-TIMESTAMP-US04.md).

Data: 2026-10-30. Status: **implementada e validada localmente**. Catálogo com JSON, Base64 e componente URL; sem commit, push ou deploy.

## Entrega e critérios de aceite

Página estática `/ferramentas/url/`, com ilha React usando o editor existente, ações explícitas de codificar/decodificar, exemplo sintético com confirmação, limpar, copiar com feedback e seleção manual se o clipboard falhar. Editar invalida o resultado anterior. Vazio é válido nas duas direções, com indicação e cópia habilitada.

Funções puras usam `encodeURIComponent` e `decodeURIComponent`, sem trim, reparação, conversão automática de camadas ou normalização Unicode. Espaço codifica como `%20`; `+` codifica como `%2B` e permanece literal ao decodificar. `%20` codificado produz `%2520`; decodificar `%2520` produz `%20`, uma única vez. Não é validador/encoder de URL inteira nem conversor de formulários.

Escapes incompletos, não hexadecimais e bytes percentuais que não formam UTF-8 válido causam erro sem resultado parcial ou exposição do conteúdo na mensagem. Codificar rejeita surrogates isolados. Na decodificação, texto não escapado segue a API nativa, inclusive um surrogate não escapado recebido diretamente pela função pura; não se promete sanitização Unicode. Acentos, emoji, combinações e BOM são preservados.

Entrada máxima existente: 1 MiB (1.048.576 bytes UTF-8) por ação. Cada byte pode gerar até três caracteres ASCII (`%HH`), portanto a saída codificada tem teto derivado de 3 MiB, sem limite arbitrário novo, truncamento ou ADR necessária. Uma saída maior que 1 MiB não é aceita inteira como nova entrada. O orçamento JSON de 8 MiB permanece específico daquela ferramenta.

Os campos multilinha normalizam LF; a cópia usa o resultado original, inclusive CR/CRLF decodificado, sujeita às regras de clipboard do sistema operacional. Não há abertura de links, execução de conteúdo, inserção HTML, requests de processamento ou persistência de entrada/saída.

## Verificações executadas

| Verificação                      | Resultado real                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS; instalação já atualizada, sem dependências novas                                                            |
| `pnpm lint`                      | PASS, sem warnings                                                                                                |
| `pnpm typecheck`                 | PASS; Astro com 0 erros/warnings/hints e `tsc --noEmit`                                                           |
| `pnpm test:unit`                 | PASS, **132 testes**, incluindo 34 novos casos URL                                                                |
| `pnpm build`                     | PASS, **6 páginas estáticas**                                                                                     |
| `pnpm test:e2e`                  | PASS, **140 aprovados e 1 skipped**, 141 casos em Chromium, Firefox e emulação mobile; aproximadamente 1,2 minuto |
| `pnpm audit --audit-level high`  | PASS, sem vulnerabilidades conhecidas                                                                             |
| Fonte/diff                       | Revisados os arquivos desta fatia; sem APIs de envio/execução/inserção HTML ou logging de conteúdo                |

`pnpm format:check` também passou. Após a correção apenas de espaços no texto, o build foi refeito e o E2E responsivo Chromium repetido: **1 aprovado**, com novas capturas inspecionadas. O HTML em `playwright-report/index.html` corresponde a essa última execução direcionada; os totais acima são da execução completa anterior.

Os unitários incluem vetores conhecidos, caracteres reservados, espaço/mais, dupla codificação, vazio, BOM/controles, Unicode sem normalização, surrogates isolados, escapes inválidos, UTF-8 inválido e fronteiras ASCII/multibyte. O caso máximo confirma 3.145.728 caracteres de saída sem truncamento e rejeição ao reutilizar essa saída acima do limite.

E2E URL cobrem busca → página → exemplo → conversões → copiar/limpar, preservação da entrada em erro, invalidação da saída, confirmação de exemplo, fallback de seleção, limites, teclado, BOM, CR/CRLF, ausência de JavaScript e axe nos estados vazio/sucesso/erro em claro/escuro. As suítes anteriores de JSON/Base64 e catálogo foram mantidas e reexecutadas.

O skipped continua sendo a leitura nativa automatizada de clipboard em Firefox da suíte JSON, por limitações de permissão do runner. O editor compartilhado tem cópia nativa validada em Chromium desktop/mobile; URL verifica os valores enviados à API por instrumentação controlada, sem alegar leitura real de clipboard Firefox.

## Segurança, layout e medições

Payload percentual de HTML e `javascript:` permaneceu texto no textarea. Durante a transformação, nenhum request, mudança de URL com conteúdo, cookie ou armazenamento em localStorage/sessionStorage/IndexedDB; reload não restaurou os campos. Sem alteração de CSP, headers, stack ou dependências. Tema continua sendo a única persistência intencional.

Sem overflow da página em 320/375/768/1024/1440 px, mesmo com saída longa. Capturas reais mobile/desktop, sucesso claro e erro escuro, foram inspecionadas em `test-results/url-URL-responsivo-com-saída-longa-e-capturas-reais-chromium/`. A inspeção identificou e levou à correção de espaços ausentes no texto explicativo. Relatório automatizado em `playwright-report/index.html`; artefatos locais ignorados pelo Git.

Ensaio sintético em Node 24.22.2, separado da renderização: codificar 1 MiB ASCII levou aproximadamente **9 ms**, codificar 1 MiB multibyte **9 ms**, e decodificar 1 MiB de escapes válidos **2 ms**. Não são medições de Lighthouse, INP ou garantia de tempo em dispositivos móveis; os testes de limites em navegador incluem renderização e automação.

## Arquivos e limitações

Novos: `src/lib/tools/url-component.ts`, `src/data/url-example.ts`, `src/components/react/UrlComponentTool.tsx`, `src/pages/ferramentas/url.astro`, `tests/unit/url-component.test.ts`, `tests/e2e/url.spec.ts` e este relatório. Atualizados: catálogo, home, privacidade, testes de busca/base, README, PRD, andamento do plano e nota histórica em US02. Editor compartilhado e lógica JSON/Base64 não precisaram mudar.

O repositório ainda contém arquivos não rastreados; `git diff` comum não enumera esses arquivos. A revisão inclui leitura direta e verificação de whitespace com `--no-index`. Nenhuma regra crítica de teste foi removida ou enfraquecida.

Leitor de tela, zoom manual do navegador, dispositivos físicos/Safari, Lighthouse, pesquisa com usuários, CI remoto e HTTPS/headers de produção: **NOT RUN**. Axe/emulação não substituem essas verificações. Retenção do clipboard, extensões e restauração de formulários pelo navegador permanecem fora da garantia do aplicativo. Sem nova decisão de arquitetura necessária.

**Próximo incremento:** P3.3/US04, tempo Unix com unidades e fusos explícitos, em uma fatia separada.

## Referências de comportamento

- [MDN — encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
- [MDN — decodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)
