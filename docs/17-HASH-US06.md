# 17 — SHA-256 de texto UTF-8 (US06)

> Registro histórico da fatia US06. A revisão integrada atual está em [18 — Pré-release](18-PRE-RELEASE.md).

Data: 2026-10-30. Status: **implementada e validada localmente**, sem commit, push ou deploy. As seis ferramentas previstas em P2/P3 estão implementadas; isso não conclui os critérios de release P4/P5.

## Entrega e decisões de comportamento

Página estática `/ferramentas/hash/`, com ilha React para calcular, exemplo sintético, copiar/selecionar manualmente e limpar. A função assíncrona usa exclusivamente `TextEncoder` e `crypto.subtle.digest('SHA-256', bytes)`. Saída de 64 caracteres hexadecimais minúsculos, incluindo hash válido para entrada vazia. Sem algoritmo próprio, dependências, arquivos binários ou fallback criptográfico.

Mantido limite de 1 MiB (1.048.576 bytes UTF-8) por cálculo. Espaços, controles, acentos, sequências Unicode combinadas e BOM existente fazem parte da entrada; não há trim, normalização Unicode ou BOM adicionado. Surrogates isolados são rejeitados antes do digest, sem substituição silenciosa. A validação existente de Base64 foi extraída sem alteração para um helper Unicode realmente usado por ambas as ferramentas.

O campo multilinha do navegador normaliza CR/CRLF para LF: o hash da interface corresponde ao texto do campo. A função testada isoladamente preserva a distinção entre CRLF/LF. O exemplo é `abc`, sem quebra de linha final, com hash conhecido `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.

O editor compartilhado passou a aceitar resultado síncrono ou Promise. Durante um digest pendente, novas execuções ficam bloqueadas; entrada, limpar e exemplo continuam disponíveis. Uma versão volátil do estado invalida respostas/erros antigos após edição, limpar, troca de exemplo ou desmontagem. Não se promete cancelar a operação nativa iniciada. Erros são locais, sem trechos da entrada em logs ou mensagens encaminhadas.

Contexto seguro/SubtleCrypto indisponíveis geram aviso e desabilitam a ação. Hashing não cifra texto, não oferece decodificação e não substitui armazenamento apropriado de senhas; entradas previsíveis podem ser descobertas por tentativas e o próprio hash pode ser sensível. Esses limites estão na página.

## Verificações executadas

| Verificação                      | Resultado real                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS; instalação já atualizada, sem dependências novas                                   |
| `pnpm lint`                      | PASS, sem warnings                                                                       |
| `pnpm format:check`              | PASS no escopo configurado                                                               |
| `pnpm typecheck`                 | PASS; Astro com 0 erros/warnings/hints e `tsc --noEmit`                                  |
| `pnpm test:unit`                 | PASS, **279 testes**, incluindo 36 casos novos de hash                                   |
| `pnpm build`                     | PASS, **9 páginas estáticas**                                                            |
| `pnpm test:e2e`                  | PASS, **286 aprovados e 2 skipped**, de 288 casos em Chromium, Firefox e emulação mobile |
| `pnpm audit --audit-level high`  | PASS, sem vulnerabilidades conhecidas                                                    |

Unitários usam Web Crypto real para vetores conhecidos (vazio, `abc`, `hello world` e um milhão de letras `a`), Unicode, controles, BOM, distinção CRLF/LF e fronteiras ASCII/multibyte imediatamente abaixo/no/acima de 1 MiB. A comparação independente usa `node:crypto.createHash` somente nos testes. Verificam o algoritmo, bytes exatos e receptor SubtleCrypto, além de rejeição de surrogates/excesso antes da API, contexto inseguro/API ausente e digest rejeitado sem resultado parcial.

Os E2E novos cobrem catálogo/busca checksum → página → exemplo → hash nativo → copiar/limpar; vazio e Unicode; limites; indisponibilidade da API; erro recuperável; HTML hostil; exemplo com confirmação; clipboard bloqueado/seleção; teclado; ausência de JavaScript; axe nos estados vazio/sucesso/erro nos dois temas; layout e leitura da saída em 320–1440 px.

Seis cenários de concorrência por projeto mantêm o primeiro digest pendente, preservando a API nativa para produzir o resultado, e acionam editar/limpar/exemplo antes de resolver ou rejeitar. Comprovam descarte do resultado/erro antigo, bloqueio de reentrada e recuperação com novo cálculo. As suítes anteriores permaneceram ativas para verificar as ações síncronas, cópia pendente, JSON, Base64, URL, tempo Unix e UUID.

A execução completa final dos E2E levou aproximadamente **1,9 minuto**, com os totais acima.

Os dois skipped continuam sendo leitura nativa de clipboard Firefox em JSON/UUID, por limitação de permissões do runner. Cópia nativa do editor compartilhado foi verificada em Chromium desktop/mobile. SHA-256 verifica o valor exato entregue à API por instrumentação, além de fallback, sem alegar leitura real de clipboard Firefox.

## Segurança, layout e medições

Sem mudança de stack/CSP/headers, backend, recursos remotos ou dependências. Fonte revisada sem envio de conteúdo, execução arbitrária, inserção HTML ou logging de dados. HTML hostil foi tratado como texto e convertido em hash sem execução. Durante cálculo, nenhum request de processamento, conteúdo na URL, cookies ou persistência em localStorage/sessionStorage/IndexedDB; reload não reidratou os campos. Apenas o tema tem persistência intencional.

Capturas reais mobile/desktop e tema escuro inspecionadas em `test-results/hash-hash-responsivo-com-resultado-legível-e-capturas-reais-chromium/`. Sem overflow da página em 320/375/768/1024/1440 px. A saída quebra visualmente em telas estreitas, mantendo a string de 64 caracteres na cópia. Relatório automatizado em `playwright-report/index.html`, com artefatos locais ignorados pelo Git.

Ensaio sintético da lógica em Node 24.22.2, separado da renderização: SHA-256 de 1 MiB ASCII levou cerca de **14 ms** e de 1 MiB multibyte **4 ms**; ambos produziram 64 caracteres. A primeira execução inclui inicialização. No ensaio Node, o marcador de contexto seguro foi definido explicitamente; não é teste de HTTPS ou performance em aparelhos móveis. Não são medições de INP/Lighthouse.

## Arquivos e limitações

Novos: `src/lib/tools/hash.ts`, `src/lib/unicode.ts`, `src/data/hash-example.ts`, `src/components/react/HashTool.tsx`, `src/pages/ferramentas/hash.astro`, `tests/unit/hash.test.ts`, `tests/e2e/hash.spec.ts` e este relatório. Atualizados: `TextTool.tsx` (Promise, estado pendente e indisponibilidade), Base64 (extração do helper sem mudança de semântica), catálogo, home/privacidade, testes de busca/base, README, PRD, plano e nota histórica de US05.

Arquivos do repositório inicial continuam não rastreados. A revisão inclui leitura direta, `git diff` e whitespace com `--no-index`, pois o diff comum não enumera novos arquivos. Sem remoção ou enfraquecimento de testes críticos. Sem ADR necessária: semântica detalha US06 na arquitetura e nos limites existentes.

Leitor de tela, zoom manual, dispositivos físicos/Safari, Lighthouse, pesquisa com usuários, CI remoto e HTTPS/headers reais: **NOT RUN**. Contexto inseguro/API ausente foram simulados; cálculo nativo foi executado em localhost confiável. Extensões, restauração de formulários e retenção/sincronização do clipboard continuam fora da garantia do aplicativo.

## Próxima etapa

**P4 — validação integrada e candidata a release**: revisões de segurança/UX/pré-release, performance de laboratório, SEO, guia de deploy/rollback e relatório de prontidão. Pesquisa com usuários e validações manuais devem ter evidências reais ou ser marcadas como pendentes. P5 depende de autorização explícita e domínio/ambiente definidos; nenhum deploy foi realizado ou autorizado nesta fatia.

## Referências consultadas

- [MDN — SubtleCrypto.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
- [MDN — TextEncoder.encode](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode)
