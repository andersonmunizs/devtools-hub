# 07 — Roadmap em fatias verticais e backlog

Não gerar todas as páginas e seis ferramentas de uma só vez. Cada etapa só avança ao cumprir seu gate e após revisão da pessoa responsável.

## Etapa 0 — Descoberta e decisões (sem código de produção)

**Entregas:** ler documentos; resumir riscos; inspecionar docs oficiais de Astro 7, React, Tailwind 4, Playwright e segurança; enumerar comandos; preparar plano/ADR somente para decisões abertas. Construir quadro inicial com hipóteses da pesquisa, sem inventar entrevistas.

**Gate:** stack, limite de 1 MiB, processamento local, UX, MVP e métricas compreendidos. Não inventar “pesquisa feita”.

## Etapa 1 — Base técnica navegável

**Entregas:** Astro 7 + React + TS strict, Tailwind 4, pnpm lockfile, eslint/prettier, Vitest, Playwright, axe, GitHub Actions, CSP Astro/headers Cloudflare, `SiteLayout`, home, página de privacidade, 404, catálogo **somente JSON**; tokens de design, tema; metadados e robots/sitemap se configuração exigir domínio informado.

**Gate:** home/página JSON carregam no build; lint/tipos/testes/build E2E smoke funcionando; README de execução; sem scripts remotos; sem affordance falsa; CSP testada no preview.

## Etapa 2 — Primeira fatia: JSON completo

**Entregas:** utilitário puro validado, UI com input/output, formatar/minificar, exemplo original, limpar/copiar/erro, limites, testes de borda, E2E e a11y; screenshots reais desktop/mobile.

**Gate:** US01 passa em ambiente real; nenhuma requisição com input; sem regressões de UI/CSP; release candidata interna.

## Etapa 3 — Mais ferramentas, uma por PR

**Ordem:** Base64 → URL component → Timestamp → UUID → SHA-256. **Uma US/PR**, com revisão de segurança e DoD. Catálogo inclui ferramenta somente quando pronta e testada.

**Gate:** critérios específicos US02–US06 e verificações transversais passam.

## Etapa 4 — Validação de experiência e lançamento

**Entregas:** 5–8 sessões exploratórias (se viáveis), registrar achados genuínos, corrigir fricções, auditoria SEO/a11y/performance, validação Cloudflare Pages, política de privacidade clara, domínio e processo de rollback.

**Gate:** DoR em `docs/06`, riscos aceitos/mitigados, nenhum conteúdo fictício de marketing, publicação autorizada.

## Etapa 5 — Evolução por evidência

Candidatas: diff de texto, regex isolada, CSV, JSONPath (com parser seguro, sem `eval`), favoritos de *nomes* de ferramentas (não conteúdos). Cada candidata exige dados da pesquisa, especificação, revisão de risco, tamanho de bundle e decisão ADR.

## Backlog técnico e organização Git

- `feat:` funcionalidade completa; `fix:` bug; `test:` teste; `docs:` documentação; `chore:` manutenção; `security:` correção de segurança.
- Uma feature branch/PR por slice; descrição de PR com problema, solução, teste, prints e riscos.
- Nunca executar commit automático sem validar diff e sem alinhamento com pessoa responsável.
- Próximas tarefas devem vir de critérios de aceitação explícitos, não de “adicione mais funcionalidades legais”.

## Gates de decisão para escopo maior

**Adicionar uma lib:** ela resolve necessidade não coberta por API nativa? Qual o tamanho/bundle? Vulnerabilidades/licença/manutenção?  
**Adicionar backend:** qual fluxo exige persistência? Como se protegerão autenticação, autorização, logs, tokens, LGPD e custos?  
**Adicionar IA ao produto:** necessidade validada, conteúdo enviado, consentimento, retenção, custo e segurança de prompt injection?  
**Adicionar analytics:** qual decisão real requer métrica e como fazê-la sem coletar conteúdo?  
**Adicionar ferramenta regex/HTML/JS:** qual isolamento impede ReDoS e execução de conteúdo arbitrário?

Sem respostas aceitáveis, manter o escopo original.
