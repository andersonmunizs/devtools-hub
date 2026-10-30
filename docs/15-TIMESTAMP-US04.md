# 15 — Conversor de tempo Unix (US04)

> Registro histórico da fatia US04. A entrega seguinte está em [16 — UUID/US05](16-UUID-US05.md).

Data: 2026-10-30. Status: **implementada e validada localmente**, sem commit, push ou deploy. Catálogo com quatro ferramentas: JSON, Base64, componente URL e tempo Unix.

## Entrega e semântica

Página estática `/ferramentas/timestamp/` com ilha React e o editor compartilhado. Entrada numérica, dois botões com unidades explícitas (segundos/milissegundos), exemplo sintético fixo, confirmação antes de sobrescrever, copiar com feedback/fallback de seleção, limpar e invalidação de resultado ao editar. Não há detecção de unidade, relógio em tempo real ou entrada de datas locais para conversão inversa.

Resultado em texto com UTC ISO 8601, horário no fuso identificado pelo navegador (nome, deslocamento e era gregoriana) e ambos os valores Unix. A saída desta ferramenta quebra linhas visualmente em telas estreitas sem inserir quebras no texto copiado; o comportamento padrão de JSON/Base64/URL permanece sem quebra automática.

Segundos aceitam sinal opcional, dígitos ASCII e até três casas decimais com ponto; milissegundos somente inteiros. Vazio, espaços, quebra de linha final, vírgula, expoente, hexadecimal, NaN, infinito e precisão excedente são rejeitados. Zeros iniciais, sinal positivo e zeros fracionários finais são representações numéricas válidas; a saída numérica é canônica (`+001.010` → `1.01` segundo; `-0` → `0`). Não há arredondamento/truncamento silencioso.

Mantido o orçamento de entrada de 1 MiB UTF-8. A gramática é linear, sem regex informado pelo usuário. Zeros iniciais são removidos apenas da parte inteira já validada; o comprimento significativo é conferido antes de construir BigInt. Segundos e frações são combinados como inteiros exatos, evitando erros como `1.001 * 1000` em ponto flutuante. Faixa inclusiva de Date: ±8.640.000.000.000.000 milissegundos, abaixo do limite de inteiro seguro de Number. Só então o valor é convertido para Number/Date.

Datas negativas, ano zero e anos estendidos são suportados pela API nativa. UTC usa ISO com sinal fora de 0000–9999. `Intl.DateTimeFormat` calcula a apresentação local para o instante, inclusive transições de horário de verão; não há deslocamento fixo calculado pelo aplicativo. Fuso indisponível causa erro explícito, sem substituição silenciosa. Regras históricas dependem da base de fusos do navegador; segundos intercalares não são representados por Date.

## Verificações executadas

| Comando/verificação              | Resultado real                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | PASS, instalação já atualizada                                                        |
| `pnpm lint`                      | PASS, sem warnings                                                                    |
| `pnpm typecheck`                 | PASS; Astro com 0 erros/warnings/hints e `tsc --noEmit`                               |
| `pnpm test:unit`                 | PASS, **194 testes**, incluindo 62 casos novos de timestamp                           |
| `pnpm build`                     | PASS, **7 páginas estáticas**                                                         |
| `pnpm test:e2e`                  | PASS, **179 aprovados e 1 skipped**, 180 casos em Chromium, Firefox e emulação mobile |
| `pnpm audit --audit-level high`  | PASS, sem vulnerabilidades conhecidas                                                 |

Os unitários cobrem exemplo verificado (`1700000000` segundos → `2023-11-14T22:13:20.000Z`), distinção entre unidades, zero, negativos, frações exatas, formas inválidas, limites temporais inclusivos e imediatamente excedidos, inteiros não seguros, ano zero/estendido, 1 MiB, fusos inválidos e deslocamento fracionário. Casos conhecidos de Nova York em março/novembro de 2024 verificam tanto o salto de uma hora quanto a hora repetida com deslocamentos diferentes.

E2E cobrem catálogo/busca → exemplo → ambas as unidades → cópia/limpar; confirmação de exemplo; falha de clipboard/seleção; precisão e entrada preservada em erro; fronteiras/anos estendidos; excesso em bytes e entradas numéricas longas; teclado; falha da API de fuso; HTML hostil; memória/URL/reload; ausência de JavaScript; temas claro/escuro e axe em vazio/sucesso/erro. Contextos reais de navegador com `America/New_York`, `America/Cuiaba` e `Asia/Colombo` verificam horário de verão e deslocamento de meia hora. A suíte anterior permanece ativa.

O skipped continua sendo o teste de leitura nativa de clipboard Firefox da suíte JSON, por limitação de permissões do runner. A cópia real do editor é verificada em Chromium desktop/mobile. Os testes desta ferramenta instrumentam o valor entregue à API e a alternativa manual, sem alegar leitura nativa Firefox.

`pnpm format:check` passou. Após o ajuste de quebra visual mobile, lint, tipos, build e a suíte E2E completa foram repetidos: mesmos **179 aprovados e 1 skipped**, aproximadamente 1,4 minuto; os **194 unitários** também foram reexecutados com sucesso. As capturas finais foram novamente inspecionadas. Nenhum teste foi ignorado por causa do ajuste.

## Segurança e inspeção visual

Não há backend, dependências novas, armazenamento de conteúdo, rede de processamento ou mudanças de CSP/headers. Fonte revisada sem APIs de execução arbitrária, inserção HTML ou logging de entrada. Durante o fluxo, não houve requests de processamento, persistência em localStorage/sessionStorage/IndexedDB/cookies ou conteúdo na URL. Reload não reidratou os campos. A preferência de tema permanece a única persistência intencional.

Capturas reais desktop/mobile e erro escuro inspecionadas em `test-results/timestamp-timestamp-respon-c0b68-ras-reais-em-claro-e-escuro-chromium/`. A inspeção inicial identificou a necessidade de quebra visual na saída mobile; adicionada opção restrita à ferramenta e teste para impedir rolagem horizontal na saída. Layout da página verificado em 320/375/768/1024/1440 px. Relatório automatizado em `playwright-report/index.html` (artefatos locais ignorados pelo Git).

Ensaio sintético de lógica em Node 24.22.2, separado da renderização: 1 MiB de zeros convertido em cerca de **31 ms**, 1 MiB de dígitos fora da faixa rejeitado em **3 ms**, 1 MiB com caractere final inválido rejeitado em **4 ms**. A primeira medição inclui inicialização de Intl; não são números de INP/Lighthouse nem garantia de tempo em aparelhos móveis.

## Arquivos, riscos e próximo passo

Novos: `src/lib/tools/timestamp.ts`, `src/data/timestamp-example.ts`, `src/components/react/TimestampTool.tsx`, `src/pages/ferramentas/timestamp.astro`, `tests/unit/timestamp.test.ts`, `tests/e2e/timestamp.spec.ts` e este relatório. Atualizados: `TextTool.tsx` (opção de quebra visual da saída), catálogo, home/privacidade, testes de busca/base, README, PRD, plano e nota histórica de US03. Sem alterações da lógica JSON/Base64/URL, lockfile ou configurações de segurança/deploy.

O repositório continua com arquivos não rastreados. A revisão inclui leitura direta, `git diff` e verificação de whitespace por `--no-index`, já que o diff comum não enumera novos arquivos. Sem remoção ou enfraquecimento de testes críticos. Sem ADR necessária: comportamento detalha a US04 dentro da arquitetura existente.

Leitor de tela, zoom manual, dispositivos físicos/Safari, Lighthouse, pesquisa com usuários, CI remoto e HTTPS/headers reais: **NOT RUN**. Axe e emulação não substituem essas verificações. As limitações de clipboard, extensões e restauração de formulários pelo navegador permanecem. Fuso é o configurado no navegador, não garantia de localização física.

**Próximo incremento:** P3.4/US05, UUID v4 com Web Crypto e quantidade de 1 a 20, em fatia separada.

## Referências consultadas

- [MDN — Date: faixa, época Unix e apresentação local](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [MDN — Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
