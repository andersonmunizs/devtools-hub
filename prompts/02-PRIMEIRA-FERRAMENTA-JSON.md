# Prompt 02 — Implementar JSON com qualidade de produção

## PROMPT

Implemente **somente US01 (JSON)** do `docs/02-PRD-MVP.md` como fatia vertical completa. Siga `AGENTS.md`, `docs/03-UI-UX.md`, `docs/04-ARQUITETURA-E-STACK.md`, `docs/05-SEGURANCA-E-PRIVACIDADE.md` e `docs/06-TESTES-E-QUALIDADE.md`.

**Primeiro** inspecione repositório, descreva o plano curto (arquivos afetados, critérios de aceite, riscos) e depois implemente. Não reescreva a base inteira.

**Comportamento obrigatório:**
- JSON válido, incluindo objetos, arrays e valores primitivos JSON (string, number, boolean, null), formatado com 2 espaços; opção minificar, sem reordenar chaves arbitrariamente.
- Tratar JSON inválido de forma clara, preservando a entrada; não usar `eval`, nem “corrigir” ou executar trechos digitados.
- Respeitar limite **1 MiB em bytes UTF-8**, validar **antes** de processar; explicar ao usuário.
- Input/output em memória; nenhum texto enviado por `fetch`, serviço de erros, query string, cookies ou storage. Cópia apenas por clique e feedback em `aria-live`; limpar remove input/output/erro.
- Exemplo seguro sintético. Aviso breve e preciso sobre privacidade. Nota para limites de precisão numérica do JS caso JSON contenha números muito grandes; não prometer fidelidade de precisão que `JSON.parse` não oferece.
- UI visualmente refinada com hierarquia e tokens da spec, estados vazio/sucesso/erro, teclado, labels e responsividade. Sem editor pesado, fake toast ou botão sem ação.
- Função TypeScript pura, `ToolResult` tipado, sem DOM ou rede, testável separadamente.

**Teste casos obrigatórios:** `{}`, `[]`, `null`, `true`, `0`, strings, chaves/valores Unicode/emoji, escapes, array aninhado, chave `__proto__`, entrada vazia, JSON inválido em várias posições, payload estilo XSS, texto >1 MiB, strings grandes. Não atribua posição de erro/linha se não tiver cálculo confiável.

**E2E:** home → JSON → formatar → verificar texto → copiar → limpar; inválido → erro; mobile; keyboard; acessibilidade; inspecionar DevTools Network para ausência de envio de texto; storage e URL não recebem input.

**Finalização:** executar lint, format, typecheck, unit, build, e2e, audit; examinar CSP em `pnpm preview`; relatar resultados **reais** (PASS/FAIL/NOT RUN), arquivos e limitações. Não adicionar as demais ferramentas. Não publicar nem fazer push.

## Critério de aceite

US01 funciona de ponta a ponta em build real e cumpre requisitos de privacidade, segurança, acessibilidade e UX; testes passam ou bloqueios são explicitados. Só então habilitar o card JSON como funcional no catálogo.
