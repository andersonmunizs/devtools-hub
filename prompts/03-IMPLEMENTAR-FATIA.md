# Prompt 03 — Modelo reutilizável para próximas ferramentas

**Instrução:** antes de colar, substitua `[ID]`, `[NOME]` e `[US]` com uma única ferramenta planejada. Não solicitar várias US de uma vez.

## PROMPT

Implemente **apenas [ID] — [NOME]**, correspondente a **[US]** no `docs/02-PRD-MVP.md`, respeitando `AGENTS.md`, UX, arquitetura, segurança e testes documentados.

1. Inspecione ferramentas existentes, funções puras, tokens de design, componentes, padrões de erro e catálogo. Reutilize o que melhora consistência sem criar uma abstração prematura.
2. Antes de codar, apresente: objetivos, entradas/saídas, formato/unidades, casos-limite, riscos, arquivos a tocar, testes e critério de aceite da US. Identifique comportamento de API nativa que precisa ser comprovado.
3. Implemente **fatia completa**: função TypeScript pura/tipada; página Astro estática com island React; estado de erro/vazio; exemplo seguro; limite 1 MiB para conteúdo quando aplicável; ações claras de executar, limpar e copiar; explicação e semântica precisas; responsividade/teclado/a11y.
4. Use apenas transformação local, sem rede/storage de input. APIs nativas preferidas. Não executar conteúdo ou regex arbitrária sem isolamento e nova especificação.
5. Adicione testes unitários com oráculos confiáveis, erros/bordas e E2E de comportamento. Verifique XSS, rede, storage, unidades, Unicode e CSP aplicáveis.
6. Só habilite card/rota como ferramenta funcional quando estiver completa; nada de links quebrados, estados simulados ou placeholders.
7. Rode `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`, `pnpm build`, `pnpm test:e2e` e `pnpm audit --audit-level high`. Inspecione o build no navegador. Se algum comando não rodou, diga qual e por quê; não declare PASS.
8. Revise `git diff` com foco em privacidade, segurança, regressão visual, tamanho de bundle e dependências. Não instale libs extras por conveniência sem justificar e pedir aprovação quando necessário.

**Relatório obrigatório:** problema resolvido; arquivos; testes (PASS/FAIL/NOT RUN); comportamento em mobile/teclado; segurança/rede/storage; riscos residuais; próximos passos. Não faça deploy, push nem crie outra ferramenta neste incremento.

## Validação específica por US

- **US02 / Base64:** UTF-8 real, acentos/emoji, dados Base64 inválidos, sem mojibake e sem usar `btoa` diretamente em texto Unicode; documentar limites de surrogate.
- **US03 / URL:** `encodeURIComponent` e `decodeURIComponent`, percent inválido, distinguir componente de URL inteira.
- **US04 / Timestamp:** segundos vs milissegundos, UTC vs local, DST, intervalo válido, erro explícito para NaN/Infinity.
- **US05 / UUID:** `crypto.randomUUID()`, 1–20, HTTPS/secure context, falha se indisponível; jamais `Math.random()` como fallback.
- **US06 / SHA-256:** `crypto.subtle.digest` + `TextEncoder`, vetor conhecido, hex lowercase, distinção hash vs criptografia.
