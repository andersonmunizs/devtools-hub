# 04 — Arquitetura, stack, contratos e decisões técnicas

## Arquitetura escolhida

**Static-first + islands:** Astro gera HTML estático por página; React hidrata apenas a aplicação interativa dentro da página da ferramenta. Todas as transformações do MVP ocorrem no navegador. Sem servidor de aplicação, APIs, cookies de sessão ou persistência de entrada.

```
visitante → Cloudflare Pages (arquivos estáticos + HTTPS)
                    ↓
           HTML Astro + CSS
             ↓        ↓
          catálogo   página de ferramenta
             ↓        ↓
          busca     React island de formulário
                          ↓
                 utilitário TypeScript puro
                          ↓
                   resultado em memória
```

**Trade-off explícito:** Astro + React tem um nível extra de integração versus React SPA. Justifica-se por páginas individuais indexáveis e menos JavaScript inicial. Se houver bloqueio concreto de integração, propor ADR com evidências antes de trocar para React + Vite ou outro framework.

## Stack mandatória e justificativa

| Camada | Tecnologia | Motivo | Restrições |
|---|---|---|---|
| Páginas e rotas | Astro 7, `output: 'static'` | SEO, HTML rápido, baixo JS | Sem SSR/Actions no MVP |
| Interação | React 19 + `@astrojs/react` | Estado da ferramenta e feedback | Somente islands necessárias; sem RSC |
| Tipos | TypeScript `strict`/`strictest` | Contratos claros | Sem `any` silencioso |
| CSS | Tailwind CSS 4 + CSS tokens | Consistência, simplicidade | `@tailwindcss/vite`, evitar Tailwind 3 integration |
| Ícones | Lucide compatível | SVG consistente | Não depender de serviço externo |
| Dependências | pnpm + lockfile | Reprodutibilidade | Node 24 LTS; fixar `packageManager` |
| Unit/component | Vitest + Testing Library | Lógica verificável | Testar comportamento, não implementação |
| E2E | Playwright | Fluxos em navegador | Verificar desktop e mobile |
| A11y | axe-core / `@axe-core/playwright` | Identificar erros automatizáveis | Auditoria humana complementar |
| Lint/format | ESLint + Prettier | Consistência | Sem disabled regras genéricas |
| CI | GitHub Actions | Gates a cada PR | Mínimo privilégio, lockfile fixado |
| Hospedagem | Cloudflare Pages | HTML estático + headers | Não usar Pages Functions no MVP |

**Versões:** as linhas principais acima são deliberadas. Instalar **patches estáveis corrigidos** e registrar números exatos no `package.json`/lockfile em setup; não fixar manualmente um patch supostamente seguro sem consulta de advisories. Conferir compatibilidade Astro/React/Vite/Node; registrar em PR versões resolvidas e fontes consultadas.

## Estrutura alvo do projeto (a ser criada pelo Codex)

```
.
├── AGENTS.md
├── README.md
├── docs/
├── prompts/
├── .github/workflows/ci.yml
├── public/
│   ├── _headers
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── astro/      # layout e conteúdo estático
│   │   └── react/      # ferramentas interativas
│   ├── layouts/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── privacidade.astro
│   │   ├── 404.astro
│   │   └── ferramentas/[slug].astro
│   ├── data/tools.ts  # catálogo tipado, slugs e metadados
│   ├── lib/tools/     # funções puras, sem DOM, sem rede
│   ├── styles/global.css
│   └── types/
├── tests/
│   ├── unit/
│   └── e2e/
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

Não gerar todos os componentes antes de usá-los. O route `[slug]` deve produzir **apenas** os caminhos realmente publicados via `getStaticPaths()`; não criar URLs para recursos futuros.

## Contrato recomendado para funções

```ts
type ToolResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };

// Exemplo de assinatura, não implementação:
function formatJson(input: string): ToolResult<string>;
```

- Funções puras `string -> ToolResult` sempre que viável; separar validação de entrada, transformação e apresentação.
- Não capturar/registrar conteúdo em logs ou exceções encaminhadas a serviços.
- Tipo de erro distinguível (`INVALID_INPUT`, `INPUT_TOO_LARGE`, `UNSUPPORTED_API`, etc.) e mensagem localizável para UI.
- Testes unitários sobre funções; testes E2E sobre UI real; dados de teste sintéticos.
- Validar UTF-8 em bytes quando houver limite. Definir política de tratamento de Unicode inválido/`TextEncoder` substituição, evitar prometer roundtrip para sequências JS de surrogate isolado sem política explícita.

## Orçamento e performance (metas iniciais, não medições)

- Catálogo e páginas devem ter HTML útil antes de hidratar ilhas; JS apenas para interações necessárias.
- Meta inicial Lighthouse (mobile, laboratório consistente): Performance ≥90, A11y ≥95, Best Practices ≥95, SEO ≥95; usar relatórios reais, não simular score. Não sacrificar correção para elevar pontuação.
- Core Web Vitals alvo: LCP ≤2,5 s; INP ≤200 ms; CLS ≤0,1, avaliados em percentil 75 quando dados reais estiverem disponíveis. Sem dados reais, declarar apenas medição de laboratório.
- Evitar editor Monaco no MVP por custo de JS; textarea sem dependência + linhas/erros simples. Adotar editor avançado apenas com análise de impacto.
- Limitar entrada a 1 MiB e evitar processamento a cada tecla; usar ação explícita e oferecer cancelamento quando processamento for adicionado em Worker.

## Build/CI scripts exigidos no package.json

- `dev` (Astro dev), `build` (`astro build`), `preview` (`astro preview`).
- `typecheck` (`astro check` + checagem TS apropriada ao setup), `lint`, `format:check`.
- `test:unit` (Vitest run), `test:e2e` (Playwright test), opcional `test:a11y` se houver suíte separada.
- Configurar `@astrojs/check`, plugins ESLint/Prettier compatíveis e evitar configuração obsoleta de versões anteriores do framework.
- Todas as etapas devem retornar exit code não-zero em erro; CI nunca deve ignorar falhas com `|| true`.

## Segurança e confiabilidade da integração

- `astro.config.mjs`: ativar `security.csp` nativo do Astro 7, diretrizes restritas, verificadas em `pnpm build && pnpm preview`, **não apenas dev**.
- `public/_headers` para proteção de frame, MIME sniffing, referrer, permissões etc. Testar headers **no deploy estático real** e não declarar `frame-ancestors` via meta CSP (não é suportado por meta).
- Não adicionar scripts externos, pixels, tag managers, CDNs, iframes, bibliotecas com chamadas de rede, fontes externas ou módulos importados remotamente sem ADR, revisão CSP e privacidade.
- Sem segredos no bundle. Variáveis públicas do bundler são públicas; não colocar tokens em variáveis acessíveis ao cliente.

## Quando um backend passa a ser justificável?

Somente para necessidade comprovada (sincronização de preferências, usuários, dados persistentes etc.); antes de implementar, produzir ADR de API, autenticação/autorização server-side, modelo e retenção de dados, rate limiting, CSRF/CORS conforme autenticação, proteção de segredos, auditoria, LGPD e backups. Um "backend só para parecer full-stack" é explicitamente proibido.
