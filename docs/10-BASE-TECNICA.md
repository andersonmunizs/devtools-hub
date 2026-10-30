# 10 — Base técnica: execução, dependências e verificação

Data: 2026-10-30. Escopo: P0/P1 do plano. **Registro histórico da base inicial em Astro 6.** O bloqueio relatado abaixo motivou a ADR-0006, agora aprovada para migração. Estado atual e retestes em [11 — Migração Astro 7](11-MIGRACAO-ASTRO-7.md); este relatório preserva os resultados anteriores. Não autoriza publicação.

## Comportamento entregue

- Astro estático com conteúdo útil antes de JavaScript; React apenas na busca do catálogo.
- Home com estado vazio honesto e busca em memória, sem ferramentas falsas. JSON não está registrado no catálogo.
- Páginas de privacidade, 404 e JSON explicitamente indisponível, sem editor ou ações de transformação. JSON e 404 possuem `noindex`.
- Tokens locais, temas claro/escuro/sistema, foco visível, skip link, navegação e layout responsivo. Sem fontes, imagens ou scripts remotos.
- CSP nativa gerada no build; `connect-src 'none'`, sem `unsafe-eval`/`unsafe-inline`; headers defensivos preparados para hospedagem estática. `frame-ancestors` é HTTP, separado da CSP meta.
- Apenas a preferência `devtools-theme` pode ser salva. Busca não é persistida, enviada ou colocada em URL. Telemetria da CLI Astro é desabilitada por `scripts/astro.mjs` em todos os comandos do projeto.

## Ambiente reproduzível

Node 24.22.2 e pnpm 11.25.0, com versões diretas exatas no `package.json` e dependências resolvidas em `pnpm-lock.yaml`. Configurações do pnpm 11 ficam em `pnpm-workspace.yaml`: engines estritos, sem instalação automática de peers, política de idade estrita e execução de scripts de instalação limitada a esbuild. O Sharp opcional do Astro não tem script de instalação autorizado; isso não remove a dependência nem seus alertas.

O ambiente inicial tinha Node 22.23.2 e um wrapper pnpm ligado a outro runtime. Para esta sessão foi baixado Node oficial isolado em `.tools/node-v24.22.2-win-x64` e instalado pnpm isolado em `.tools/pnpm`. Nada foi instalado globalmente nem a instalação do sistema foi alterada.

O ZIP Node foi comparado com o `SHASUMS256.txt` oficial: `ca1bff5d8ead13c9f2ea404a176db46bd430704d5b5113734049fa365e7799e2`. Essa comparação por HTTPS verifica integridade em relação ao manifesto; não equivale a verificação de assinatura independente.

Para reutilizar esse ambiente local no PowerShell desta máquina:

```powershell
$env:Path = "$PWD\.tools\pnpm\node_modules\.bin;$PWD\.tools\node-v24.22.2-win-x64;$env:Path"
$env:pnpm_config_store_dir = "$PWD\.tools\pnpm-store"
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.tools\pw-browsers"
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

`.tools/` é ignorada pelo Git e não é requisito para outras máquinas. Em outra máquina, instalar Node/pnpm nas versões declaradas e os navegadores Playwright; usar os comandos normais do README.

## Inventário de dependências diretas

Instalação autorizada pelo início do plano aprovado, limitada às tecnologias prescritas e seus plugins de qualidade. Sem biblioteca adicional de UI, backend ou serviço externo. Testing Library não foi instalada: a busca possui lógica unitária e interação coberta por E2E; avaliar sua necessidade no incremento JSON.

| Dependência                      | Versão           | Licença declarada | Motivo e efeito no cliente                                     |
| -------------------------------- | ---------------- | ----------------- | -------------------------------------------------------------- |
| astro                            | 6.4.8            | MIT               | Build estático/runtime de ilhas; alertas pendentes na ADR-0006 |
| @astrojs/react                   | 5.0.7            | MIT               | Integração React compatível com o Vite 7 do Astro 6            |
| react / react-dom                | 19.3.1 / 19.3.1  | MIT               | Estado e hidratação da busca; compõem o JS da home             |
| lucide-react                     | 1.64.0           | ISC               | Dois ícones importados por nome; tree shaking no build         |
| tailwindcss / @tailwindcss/vite  | 4.3.3 / 4.3.3    | MIT               | Compilação CSS; sem runtime próprio no navegador               |
| typescript                       | 5.9.3            | Apache-2.0        | Tipos strictest; desenvolvimento                               |
| @astrojs/check                   | 0.9.12           | MIT               | Diagnóstico Astro; desenvolvimento                             |
| @types/node                      | 24.19.2          | MIT               | Tipos do ambiente de build/teste                               |
| @types/react / @types/react-dom  | 19.3.0 / 19.3.0  | MIT               | Tipos das ilhas; sem runtime                                   |
| vitest                           | 5.0.5            | MIT               | Testes unitários; não enviado ao cliente                       |
| @playwright/test                 | 1.64.1           | Apache-2.0        | E2E em Chromium, Firefox e emulação mobile                     |
| @axe-core/playwright             | 4.14.0           | MPL-2.0           | Auditoria automática somente nos testes                        |
| eslint / @eslint/js              | 10.13.0 / 10.0.1 | MIT               | Lint; desenvolvimento                                          |
| eslint-plugin-astro              | 3.2.1            | MIT               | Regras e parsing de arquivos Astro; exige ESLint 10            |
| typescript-eslint                | 8.72.1           | MIT               | Parsing/regras TypeScript; desenvolvimento                     |
| prettier / prettier-plugin-astro | 3.9.10 / 1.1.2   | MIT               | Formatação incluindo Astro; desenvolvimento                    |

Fontes: metadados do [registro npm](https://registry.npmjs.org/), [distribuição oficial Node](https://nodejs.org/dist/), [integração React](https://docs.astro.build/en/guides/integrations-guide/react/), [Tailwind com Astro](https://tailwindcss.com/docs/installation/framework-guides/astro), [configuração CSP Astro](https://docs.astro.build/en/reference/configuration-reference/#securitycsp), [Playwright](https://playwright.dev/docs/test-configuration) e [headers Cloudflare](https://developers.cloudflare.com/pages/configuration/headers/). A documentação pública pode acompanhar uma linha mais nova; tipos e comportamento foram conferidos também na versão instalada.

Astro 6 e a integração React 5 foram mantidos por exigência do projeto, mesmo existindo linhas principais posteriores. TypeScript 5 também segue a stack mandatória. pnpm 11.25.0 é a versão estável compatível já disponível, fixada no projeto, sem assumir que seja a mais nova. Lucide 1.65.0 foi substituído por 1.64.0 para remover uma exceção automática de idade criada pelo pnpm; o lockfile foi regenerado sem relaxar a política.

Riscos de supply chain permanecem mesmo com pin/lockfile; revisar advisories e licenças transitivas nas atualizações. Builds iniciais emitiram avisos de anotações de comentários no Zod transitivo; não foram alterados pacotes nem regras para ocultar falhas.

## CI e implantação futura

Workflow local preparado para PR/push em `main`, `contents: read`, sem secrets, sem deploy e sem ignorar falhas. Actions checkout/setup-node/pnpm foram fixadas por SHA dos tags oficiais consultados. CI instala com lockfile congelado e executa lint, formato, tipos, unit, build, navegadores, E2E e audit. A execução no GitHub depende de repositório remoto e não foi realizada nesta tarefa.

A publicação futura será em Cloudflare Pages, saída `dist/`, build `pnpm build`, com Node/pnpm declarados. Antes de qualquer publicação é necessária decisão da ADR-0006 e aceite de segurança; depois, autorização explícita e domínio/ambiente confirmados. Não há domínio fictício, canonical, sitemap, HSTS/preload ou configuração de deploy remoto nesta entrega.

`pnpm preview` não aplica automaticamente `public/_headers`. Validar os headers no domínio real após uma implantação autorizada, antes de divulgação. Rollback futuro: restaurar a última implantação estática aprovada no provedor e retestar status/headers/fluxos; ainda não há implantação anterior neste projeto.

## Verificações e limites

Arquivos criados: `src/` (páginas, layout, busca, tema, estilos e registro), `tests/unit/`, `tests/e2e/`, `public/_headers`, `public/robots.txt`, `public/favicon.svg`, `scripts/astro.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.node-version`, `.gitignore`, configurações Astro/TypeScript/ESLint/Prettier/Vitest/Playwright e `.github/workflows/ci.yml`; documentação nova neste arquivo e na ADR-0006. Arquivos preexistentes editados: `README.md` e atualização de andamento ao final de `docs/09-PLANO-DE-IMPLEMENTACAO.md`. As demais especificações, prompts, `AGENTS.md` e `texte.txt` foram preservados.

Execução local em Windows, Node 24.22.2, pnpm 11.25.0. Os comandos finais usaram o ambiente isolado descrito acima.

| Verificação                                 | Resultado real                                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`            | PASS, lockfile reproduzível e política de idade estrita                                                                                                                   |
| `pnpm lint`                                 | PASS, sem warnings                                                                                                                                                        |
| `pnpm format:check`                         | PASS para os arquivos cobertos; especificações originais preservadas fora da formatação automática                                                                        |
| `pnpm typecheck`                            | PASS, Astro check sem erros/warnings/hints e `tsc --noEmit`                                                                                                               |
| `pnpm test:unit`                            | PASS, 6 testes de busca/registro do catálogo                                                                                                                              |
| `pnpm build`                                | PASS, 4 páginas estáticas; avisos de comentários de anotação do Zod transitivo                                                                                            |
| `pnpm test:e2e`                             | PASS, 33 testes: Chromium, Firefox e emulação iPhone 13 em Chromium (não Safari/iPhone real)                                                                              |
| axe nos dois temas                          | PASS, páginas home/privacidade/JSON/404 nos três projetos; sem violações dos critérios automatizados selecionados                                                         |
| Rede/storage/URL/reload                     | PASS nos fluxos automatizados de busca sintética; nenhuma requisição durante digitação, sem conteúdo em storage/URL; reload sem busca restaurada pelo app                 |
| Teclado e temas                             | PASS nos fluxos E2E; skip link, foco, busca, sistema/preferência persistida e falha de armazenamento                                                                      |
| CSP meta no build/preview                   | PASS nos controles testados; ilhas e tema funcionam sem liberar execução inline/eval genericamente                                                                        |
| Responsividade                              | PASS, sem overflow em 320/375/768/1024/1440 px e texto ampliado; teste não substitui zoom manual                                                                          |
| `pnpm audit --audit-level high`             | **FAIL**, 10 alertas: 1 crítico/3 altos/4 moderados/2 baixos; saída final em `.tools/audit-final.txt`                                                                     |
| Diff e arquivos novos                       | Inspecionados; `git diff --check` e checagem `--no-index` de código/testes sem erros de whitespace. Arquivos de partida continuam não rastreados; nenhum commit foi feito |
| GitHub Actions, deploy e headers HTTP reais | NOT RUN; configuração local não prova comportamento em produção                                                                                                           |

Falhas intermediárias foram corrigidas: propriedade opcional do Playwright incompatível com tipos estritos; overflow de palavra longa em título com texto ampliado; seletor de teste que ignorava `noscript` mesmo quando seu conteúdo estava visível. Nenhum critério foi removido. Um bloqueio temporário de download do navegador foi resolvido pelo retry do instalador.

Capturas reais da home foram inspecionadas em 375/1440 px e tema escuro desktop, em `test-results/base-layout-sem-overflow-de-320-a-1440-px-e-texto-ampliado-chromium/`. Relatório E2E: `playwright-report/index.html`. São artefatos locais ignorados pelo Git, sem conteúdo real de usuários.

Medição do build local: três arquivos JS em `dist/_astro`, somando **228.710 bytes** (soma de gzip local por arquivo: **72.693 bytes**), e CSS de **11.158 bytes** (gzip local **3.304 bytes**). Inclui runtime React e busca/Lucide. Não é medição de transferência em produção nem Lighthouse; as demais páginas não hidratam uma ilha React.

Uma busca estática em `src/`, `public/` e configuração não encontrou APIs de envio de conteúdo, execução arbitrária ou inserção HTML. O URI de namespace no SVG não é uma chamada de rede. Essa inspeção complementa os testes, sem equivaler a auditoria formal ou pentest.

**Resultado do gate: P1 funcional localmente, mas não aprovada em segurança.** Ver [ADR-0006](adr/0006-atualizacao-de-seguranca-do-astro.md). Não existe autorização para publicar, aceitar os alertas ou alterar a stack. O próximo passo é decidir a ADR e resolver a auditoria antes de iniciar P2/JSON.

Leitor de tela, zoom manual de navegador a 200%/400%, teste moderado com usuários, Lighthouse, headers de produção e execução real do GitHub Actions exigem verificações próprias; não inferir aprovação dessas áreas de smoke tests ou axe.
