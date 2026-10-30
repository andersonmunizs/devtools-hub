# Prompt 01 — Scaffolding seguro e primeira interface real

## PRÉ-CONDIÇÕES

Executar **após** revisão do plano do prompt 00. Atuar somente no repositório local. Código incompleto de ferramentas não deve ficar publicado como se funcionasse.

## PROMPT

Implemente **somente a Etapa 1** de `docs/07-ROADMAP-E-ENTREGAS.md`: o alicerce executável para DevTools Hub. Leia `AGENTS.md` e as seções pertinentes de PRD, UI/UX, arquitetura, segurança e testes.

**Stack mandatória:** Astro 7 em `output: 'static'`, React 19 com `@astrojs/react` para ilhas, TypeScript strict/strictest, Tailwind CSS 4 com Vite plugin, Node 24 LTS, pnpm com `packageManager` e lockfile, Vitest, Testing Library quando útil, Playwright, axe-core, ESLint, Prettier, GitHub Actions e Cloudflare Pages. Sem backend, auth, banco, React Server Components, tracking, scripts externos ou storage de textos. Conferir versão/patches em fontes oficiais e pin no lockfile; não inventar versões.

**Entregáveis:**
1. Configurar projeto Astro, lint, formatting, TS checking, scripts package.json, testes e pipeline CI de PR com permissões mínimas.
2. Criar design tokens e dois temas (claro/escuro), componentes sem excesso de JS; usar fontes locais/sistema.
3. Criar home funcional de catálogo/busca (pode conter **apenas JSON**, o único slug de ferramenta habilitado inicialmente); nada de cards ou links para ferramentas não implementadas.
4. Criar página `/ferramentas/json` com layout e explicação, **sem fingir que o validador já funciona**. Se a ferramenta não estiver pronta, uma indicação textual honesta em ambiente de desenvolvimento; preferir não publicá-la como ferramenta funcional até o incremento 02. A home pode exibir apenas um link marcado "Em desenvolvimento" sem aparência de botão funcional; na release pública ocultar até concluir.
5. Adicionar página de privacidade honesta, 404, favicon próprio mínimo, SEO básico, navegação acessível e responsiva.
6. Configurar Astro 7 `security.csp` nativo e `public/_headers` Cloudflare conforme docs/05; observar que CSP meta e header HTTP se acumulam; testar `build`/`preview` (não basta `dev`). Não relaxar CSP às cegas.
7. Criar testes smoke E2E e axe (sem afirmar cobertura que não existe), unit trivial apropriado se houver lógica e validação das páginas. 
8. Documentar como executar localmente, CI e deploy estático, e registrar versões exatas efetivamente instaladas.

**Verificações obrigatórias:** executar `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`, `pnpm build`, `pnpm test:e2e`, `pnpm audit --audit-level high`, e testar pelo menos catálogo e navegação no build local. Se comando estiver indisponível, explicar e corrigir setup antes de declarar sucesso. Inspecionar screenshot responsivo e consoles quando possível. Registrar pontos não testados.

**Regras:** não adicionar dependências sem justificativa, não fazer deploy ou push, não implementar as outras cinco ferramentas, não usar mock para simular funcionalidade. Antes de terminar, revisar o diff e preencher o relatório de `docs/06`.

## Critério de aceite

O projeto inicia, compila, roda testes básicos, entrega páginas reais com HTML útil e navegação clara; visual é consistente e acessível; nenhuma ferramenta inacabada é apresentada como funcionando; segredos inexistem no bundle; config de segurança é verificável.
