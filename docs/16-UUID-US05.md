# 16 — Gerador UUID v4 (US05)

> Registro histórico da fatia US05. A entrega seguinte está em [17 — SHA-256/US06](17-HASH-US06.md).

Data: 2026-10-30. Status: **implementada e validada localmente**, sem commit, push ou deploy. Catálogo com cinco ferramentas reais; SHA-256 segue fora do catálogo.

## Entrega e critérios

Página estática `/ferramentas/uuid/`, com ilha React para quantidade, geração, lista, cópia individual/total, seleção manual e limpar. Nenhum UUID é gerado durante a hidratação ou ao escolher o exemplo. A quantidade inicial é 1; o exemplo sintético define apenas a quantidade 3 e pede confirmação antes de descartar configuração/lista existente. Os UUIDs exibidos como resultado vêm da API real, nunca de fixtures.

Quantidade canônica inteira de 1 a 20. Rejeita vazio, zero, negativos, 21+, sinais, zeros à esquerda, casas decimais, expoente, espaços e outros caracteres, sem truncar ou limitar silenciosamente. Mantido o teto transversal de 1 MiB em UTF-8 para a entrada, validado antes da geração. Parser puro e fonte injetável apenas para testes; o caminho do navegador usa exclusivamente `crypto.randomUUID()`, preservando o receptor Crypto. Sem algoritmo próprio ou fallback para Math.random/getRandomValues.

Geração requer contexto seguro e API disponível. Caso contrário, aviso explícito e botão desabilitado. Falha durante uma chamada retorna erro e não disponibiliza lista parcial. Cada geração substitui a lista; editar a quantidade descarta saída e feedback; limpar retorna quantidade 1 e remove resultados/erros/seleção manual. Não há deduplicação nem alegação de prova matemática de unicidade.

Lista com 1–20 valores e cópia por item, identificada por nome acessível, ou total com um UUID por linha. Máximo derivado de 739 caracteres ASCII no texto total (20 × 36 + 19 quebras LF). Copiar requer ação explícita. Se a API de clipboard falhar, exibe apenas o texto escolhido em campo somente leitura e permite selecionar. Feedback de cópia pendente é invalidado ao editar, limpar ou gerar novamente, com cleanup ao desmontar. Isso não cancela uma gravação já solicitada ao clipboard do sistema.

## Verificações executadas

| Verificação                      | Resultado real                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS, instalação já atualizada; sem dependências novas                                   |
| `pnpm lint`                      | PASS, sem warnings                                                                       |
| `pnpm format:check`              | PASS no escopo configurado                                                               |
| `pnpm typecheck`                 | PASS, Astro com 0 erros/warnings/hints e `tsc --noEmit`                                  |
| `pnpm test:unit`                 | PASS, **243 testes**, incluindo 49 casos novos UUID                                      |
| `pnpm build`                     | PASS, **8 páginas estáticas**                                                            |
| `pnpm test:e2e`                  | PASS, **229 aprovados e 2 skipped**, de 231 casos em Chromium, Firefox e emulação mobile |
| `pnpm audit --audit-level high`  | PASS, sem vulnerabilidades conhecidas                                                    |

Os unitários verificam todas as quantidades de 1 a 20, rejeições antes de chamar a fonte, orçamento UTF-8, ordem/quantidade de chamadas, ausência de resultado parcial, contexto inseguro/API ausente e formato/bits de versão e variante usando Web Crypto real. As fontes sintéticas servem para contar chamadas, reproduzir falhas e confirmar que não se promete eliminar colisões; não substituem os testes nativos.

E2E verificam catálogo/busca GUID → ferramenta → exemplo → geração → cópia individual/lista → limpar; limites 1/20, edição, entradas inválidas, confirmação de exemplo, clipboard bloqueado e seleção manual, cópia pendente seguida de limpar/editar/gerar, indisponibilidade de contexto/API e falha durante geração. Também exercitam teclado, ausência de JavaScript, privacidade, temas claro/escuro, axe em vazio/sucesso/erro/fallback e layout de 320 a 1440 px, incluindo lista máxima.

A execução completa final, após corrigir o oráculo de CRLF do teste, levou aproximadamente **1,7 minuto**, com os totais acima.

Os dois skipped são leitura nativa de clipboard Firefox (JSON e UUID), por limitações de permissões do runner. Cópia real individual e total passou em Chromium desktop/mobile. O fluxo instrumentado comprova a string exata entregue a `writeText` nos três projetos, inclusive LF entre UUIDs. Windows pode devolver CRLF ao ler o clipboard nativo; esse teste compara após normalizar somente CRLF para LF. A primeira execução completa encontrou essa diferença em Chromium/mobile; o oráculo foi corrigido, preservando a comparação exata do valor enviado à API e a verificação de todos os caracteres dos UUIDs. Nenhuma lógica de geração/cópia foi alterada por essa diferença de sistema.

A checagem inicial de tipos encontrou uma tupla de teste sem anotação literal; foi corrigida com `as const` e os tipos reexecutados. Sem remoção ou enfraquecimento de requisitos de teste.

## Segurança, privacidade e revisão visual

Nenhuma dependência, backend, recurso remoto, mudança de stack, CSP ou headers. Fonte revisada sem inserção HTML, execução arbitrária, fallback não criptográfico ou logging de conteúdo. HTML hostil no campo de quantidade permaneceu dado e foi rejeitado. Geração/cópia não produziram requests, URL de conteúdo, cookies ou armazenamento em localStorage/sessionStorage/IndexedDB. Reload não reidratou a lista; apenas o tema tem persistência intencional.

Capturas reais mobile/desktop, sucesso e erro escuro, inspecionadas em `test-results/uuid-UUID-responsivo-de-32-6def2-sta-máxima-e-capturas-reais-chromium/`. UUIDs longos quebram visualmente dentro da lista sem alterar o valor copiado. Sem overflow da página em 320/375/768/1024/1440 px. Relatório em `playwright-report/index.html`; artefatos locais ignorados pelo Git.

## Arquivos, limitações e próximo passo

Novos: `src/lib/tools/uuid.ts`, `src/data/uuid-example.ts`, `src/components/react/UuidTool.tsx`, `src/styles/uuid-tool.css`, `src/pages/ferramentas/uuid.astro`, `tests/unit/uuid.test.ts`, `tests/e2e/uuid.spec.ts` e este relatório. Atualizados: catálogo, home/privacidade, testes de busca/base, README, PRD, plano e nota histórica de US04. Editor e lógica das quatro ferramentas anteriores permanecem iguais nesta fatia.

Arquivos continuam não rastreados no repositório inicial; `git diff` comum não enumera tudo. A revisão incluiu leitura direta, diff e whitespace com `--no-index`. Sem ADR necessária: implementação restrita à US05 e APIs nativas já mandatórias.

Leitor de tela, zoom manual, dispositivos físicos/Safari, Lighthouse, testes com usuários, CI remoto e HTTPS/headers em produção: **NOT RUN**. Contexto inseguro e API ausente foram simulados em E2E; a execução nativa ocorreu no localhost confiável, sem alegar validação de deploy HTTPS. Testes de formato não comprovam unicidade matemática ou auditam a entropia do sistema. Clipboard, extensões e restauração de formulários pelo navegador mantêm as limitações gerais da página de privacidade.

**Próximo incremento:** P3.5/US06, SHA-256 de texto UTF-8 com Web Crypto, em fatia separada.

## Referência consultada

[MDN — Crypto.randomUUID: UUID v4 e contexto seguro](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID).
