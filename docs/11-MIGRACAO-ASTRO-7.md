# 11 — Migração para Astro 7 e validação da base

Data: 2026-10-30. Escopo: implementar a [ADR-0006](adr/0006-atualizacao-de-seguranca-do-astro.md) aprovada nesta conversa. **Resultado: migração concluída e base validada localmente; nenhuma publicação.**

Este é o registro da migração anterior à ferramenta JSON. O estado funcional posterior está em [12 — JSON/US01](12-JSON-US01.md).

## Objetivo, mudanças e aceite

Resolver os alertas que bloquearam a base Astro 6, preservando geração estática, React 19 em ilhas, processamento local, ausência de backend e os controles de privacidade/CSP. O aceite exige instalação reproduzível, compatibilidade de tipos/build, manutenção dos fluxos existentes, acessibilidade/layout e auditoria sem alertas críticos/altos.

| Dependência                 | Antes          | Depois               | Motivo e impacto                                                            |
| --------------------------- | -------------- | -------------------- | --------------------------------------------------------------------------- |
| astro                       | 6.4.8          | 7.4.4                | Linha corrigida aprovada; licença MIT; build e runtime de ilhas atualizados |
| @astrojs/react              | 5.0.7          | 7.1.2                | Integração compatível com Astro 7/Vite 8; licença MIT                       |
| Vite (transitivo)           | 7.3.7 no Astro | 8.3.5 no grafo ativo | Bundler compartilhado pela stack; confirmado com `pnpm why vite`            |
| Sharp (transitivo opcional) | 0.34.5         | 0.35.5               | Versão corrigida resolvida pelo Astro; confirmado com `pnpm why sharp`      |

Demais dependências diretas, Node 24.22.2 e pnpm 11.25.0 permanecem nas versões da base. `package.json` contém versões exatas e `pnpm-lock.yaml` foi atualizado sem overrides, exclusões de auditoria ou relaxamento da política de idade. Não foram adicionadas dependências diretas.

Os peers `oxc-transform-react` e `@astrojs/markdown-remark` são opcionais nos manifests consultados. A base não usa memoização via React Compiler nem plugins remark/rehype; nenhuma dessas opções foi habilitada. O novo compilador Astro e o pipeline Markdown padrão chegam pelo próprio framework.

Foram revisados o [guia oficial de migração](https://docs.astro.build/en/guides/upgrade-to/v7/), a [integração React](https://docs.astro.build/en/guides/integrations-guide/react/), os metadados do [Astro 7.4.4](https://registry.npmjs.org/astro/7.4.4) e da [integração 7.1.2](https://registry.npmjs.org/@astrojs%2freact/7.1.2), além dos advisories oficiais. Não foi necessária adaptação do código das páginas ou da configuração: a aplicação não usa os recursos removidos/reconfigurados pelo guia. A compatibilidade foi verificada no build e no navegador.

O contrato `AGENTS.md`, as especificações e os prompts agora prescrevem Astro 7. O relatório anterior em `docs/10` foi identificado como histórico; seus alertas não representam a auditoria atual.

## Comandos executados e resultados reais

Ambiente: Windows, Node 24.22.2, pnpm 11.25.0, navegadores Playwright locais. Execução com o runtime isolado já descrito em `docs/10`.

| Comando / verificação                        | Resultado                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --store-dir .tools/pnpm-store` | PASS; atualização das duas dependências e do lockfile                                                                               |
| `pnpm install --frozen-lockfile`             | PASS; sem modificação necessária no lockfile                                                                                        |
| `pnpm lint`                                  | PASS, sem warnings                                                                                                                  |
| `pnpm format:check`                          | PASS no escopo configurado; documentação original tem revisão manual das alterações pontuais                                        |
| `pnpm typecheck`                             | PASS; Astro check: 0 erros, 0 warnings, 0 hints; `tsc --noEmit` aprovado                                                            |
| `pnpm test:unit`                             | PASS, 6 testes                                                                                                                      |
| `pnpm build`                                 | PASS, 4 páginas estáticas; sem os avisos de anotação Zod vistos na base anterior                                                    |
| `pnpm test:e2e`                              | PASS, 33 testes em Chromium, Firefox e emulação mobile Chromium; 20,1 s na execução registrada                                      |
| `pnpm audit --audit-level high`              | PASS, sem vulnerabilidades conhecidas; resultado anterior tinha 10 alertas                                                          |
| `pnpm why vite sharp`                        | Uma versão ativa de cada: Vite 8.3.5 e Sharp 0.35.5                                                                                 |
| Diff/arquivos novos e whitespace             | Inspecionados; sem erro de whitespace; repositório ainda sem arquivos rastreados, portanto o diff comum não enumera todo o conteúdo |

Os E2E existentes exercitam home/busca, estado vazio/sem resultados, navegação de privacidade, JSON indisponível, 404 HTTP real, teclado/skip link, temas e armazenamento bloqueado, HTML sem JavaScript, CSP, axe em dois temas e layout em 320/375/768/1024/1440 px com ampliação de texto. Os testes foram mantidos integralmente, sem remoção ou enfraquecimento de critérios.

**Rede/storage/URL:** os fluxos com busca sintética continuaram sem requisições ao digitar e sem persistência de conteúdo, sem conteúdo na URL e sem busca restaurada pelo aplicativo no reload. Apenas a preferência explícita de tema é salva.

**CSP:** meta gerada pelo build continua restringindo conexões/objetos e permitindo a hidratação e o tema por mecanismos autorizados. Não foram adicionados `unsafe-inline`, `unsafe-eval`, fontes ou scripts remotos. Headers HTTP de produção requerem ambiente real; `preview` não prova o funcionamento de `_headers`.

**Visual:** inspecionadas capturas reais desktop claro/escuro e mobile claro, sem regressão visual identificada. A captura desktop clara de 1440 px tem o mesmo SHA-256 da base anterior. As capturas anteriores foram preservadas em `.tools/migration-before/`; as atuais estão em `test-results/base-layout-sem-overflow-de-320-a-1440-px-e-texto-ampliado-chromium/`. Relatório E2E em `playwright-report/index.html`; artefatos locais ignorados pelo Git.

## Medição local de bundle

| Artefatos emitidos em `dist/_astro` |  Base Astro 6 |       Astro 7 |
| ----------------------------------- | ------------: | ------------: |
| Soma de 3 arquivos JS               | 228.710 bytes | 226.541 bytes |
| Soma de gzip por arquivo JS         |  72.693 bytes |  71.374 bytes |
| CSS                                 |  11.158 bytes |  11.225 bytes |
| Gzip local do CSS                   |   3.304 bytes |   3.349 bytes |

Medição por leitura dos arquivos emitidos e `gzipSync` local. Não equivale a tamanho transferido em produção nem a medição Lighthouse/Core Web Vitals. O custo do React permanece concentrado na busca da home.

## Arquivos modificados

- Dependências: `package.json`, `pnpm-lock.yaml`.
- Contrato e uso: `AGENTS.md`, `README.md`.
- Especificações: `docs/04-ARQUITETURA-E-STACK.md`, `docs/05-SEGURANCA-E-PRIVACIDADE.md`, `docs/07-ROADMAP-E-ENTREGAS.md`, `docs/08-DECISOES-E-REFERENCIAS.md`.
- Andamento e evidências: `docs/09-PLANO-DE-IMPLEMENTACAO.md`, `docs/10-BASE-TECNICA.md`, `docs/adr/0006-atualizacao-de-seguranca-do-astro.md` e este novo relatório.
- Roteiros: `prompts/00-INICIAR-CODEX.md`, `prompts/01-SCAFFOLD-E-BASE.md`, `prompts/04-REVISAO-SEGURANCA.md`, `prompts/06-PRE-RELEASE.md`.

## Riscos, limitações e próximo passo

Ausência de alertas conhecidos não prova ausência de vulnerabilidades. Reavaliar patches e advisories nas próximas alterações e antes de publicar.

GitHub Actions remoto, Cloudflare/HTTPS/headers reais, Lighthouse, leitores de tela, zoom manual do navegador e sessões moderadas com usuários: **NOT RUN** nesta migração. Os testes de mobile são emulados, sem avaliação em iPhone/Safari real. Os avisos de ambiente `NO_COLOR`/`FORCE_COLOR` do runner não afetaram os resultados.

O bloqueio de dependências da P1 está resolvido. Próximo incremento: P2/US01, validador/formatador JSON completo, conforme PRD e `prompts/02-PRIMEIRA-FERRAMENTA-JSON.md`, com limites, tratamento de erros, cópia/limpeza, privacidade e testes próprios. O catálogo permanece vazio até a ferramenta estar pronta. Não houve commit, push ou deploy.
