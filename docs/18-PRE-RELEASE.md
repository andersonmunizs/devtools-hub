# 18 — Revisão integrada e prontidão de release (P4)

Data: 2026-10-30. **Veredito: NO-GO para publicação agora.** Os gates locais passaram; ainda faltam origem versionada/revisada, domínio/ambiente aprovados, validações humanas e verificação real de HTTPS/headers. A candidata pode seguir para essas verificações. Nenhum deploy, push, commit ou alteração do código de produção nesta revisão.

## Escopo e evidências

Revisão dos roteiros `prompts/04`, `05` e `06`, PRD, UX, arquitetura, segurança, qualidade, roadmap, fonte das seis ferramentas, editor/gerador, tema/layout, CI, CSP, `_headers`, robots e build. Executados comandos de qualidade, navegação real, testes de segurança/privacidade, axe, reflow, inspeção de capturas e Lighthouse local. Não é pentest formal, revisão humana externa ou declaração de conformidade WCAG/OWASP.

As seis rotas anunciadas estão implementadas e testadas: JSON, Base64, componente URL, timestamp, UUID v4 e SHA-256. O build contém 9 HTMLs (home, privacidade, 404 e ferramentas), 26 arquivos e **397.758 bytes brutos**; nenhum source map. Não equivale a transferência comprimida ou custo por página.

Inventário e resultados brutos locais em `.tools/p4-review-evidence.json`; Lighthouse em `.tools/p4-lighthouse/*.report.{json,html}`; E2E em `playwright-report/index.html`. Artefatos são locais, ignorados pelo Git. Manifesto SHA-256 dos caminhos/tamanhos/digests de `dist/` nesta execução: `e5f53c6f6990ae5044d39f5d55ad4612e417cb8390a81616aee05a2501a4ef64`. Não substitui uma origem versionada ou assinatura de release.

## Gates e resultado real

| Requisito                                | Evidência                                                                    | Estado              | Severidade/ação                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| Instalação congelada                     | `pnpm install --frozen-lockfile`; já atualizada                              | PASS                | Sem dependências novas no projeto                                                    |
| Lint/formato/tipos                       | Scripts existentes executados; Astro 0 erros/warnings/hints e `tsc --noEmit` | PASS                | Repetidos após incluir os testes de release                                          |
| Transformações                           | `pnpm test:unit`: **279 aprovados**                                          | PASS                | Vetores, erros, limites e Unicode                                                    |
| Build estático                           | `pnpm build`: **9 páginas**, sem servidor de aplicação                       | PASS                | Artefato inspecionado                                                                |
| Navegação e regressões                   | `pnpm test:e2e`: **295 aprovados e 2 skipped**, de 297, cerca de 2 minutos   | PASS                | Chromium, Firefox e emulação mobile                                                  |
| Dependências                             | `pnpm audit --audit-level high`: sem vulnerabilidades conhecidas             | PASS                | Resultado desta data; repetir antes do rollout                                       |
| Privacidade/XSS/CSP local                | Suítes com dados sintéticos, Network/storage/URL/console e fonte             | PASS                | Sem relaxamento da política                                                          |
| Metadata/links                           | Novo `tests/e2e/release.spec.ts`, 3 cenários × 3 projetos                    | PASS                | Títulos/descrições únicos, idioma, 404 noindex, recursos locais, links/âncoras reais |
| Acessibilidade automatizada              | axe nos temas/estados e Lighthouse                                           | PASS                | Não certifica acessibilidade manual                                                  |
| Reflow                                   | Viewports 320–1440 px; raiz tipográfica 200% em 320 px nas 9 rotas           | PASS                | Não é zoom nativo 200–400%                                                           |
| Performance mobile de laboratório        | Lighthouse real nas 8 páginas indexáveis                                     | PASS                | Metas locais de performance/a11y/boas práticas atingidas                             |
| Score SEO Lighthouse ≥95                 | Score bruto **91**, por fetch de robots bloqueado pela CSP                   | FAIL na medição     | Diagnóstico do auditor; arquivo/HTTP válidos, política mantida                       |
| Canonical/sitemap de produção            | Ausentes em `SiteLayout.astro`/`astro.config.mjs`; domínio não definido      | NOT RUN             | Gate antes de publicação; implementar com domínio real                               |
| Headers/HTTPS/CDN                        | Só configuração local revisada, sem ambiente implantado                      | NOT RUN             | Gate de produção; não presumir que `_headers` foi aplicado                           |
| CI remoto/origem revisada                | Workflow inspecionado; HEAD inexistente e nenhum remote configurado          | NOT RUN             | Versionar/revisar e executar CI remoto antes do rollout                              |
| Leitor de tela/zoom nativo/Safari físico | Sem execução nesta etapa                                                     | NOT RUN             | Completar ou registrar decisão explícita sobre pendências                            |
| Sessões exploratórias                    | Nenhum participante ou sessão realizada                                      | NOT RUN             | Não há evidência para validar hipóteses de produto                                   |
| Rollback e incidentes                    | [Guia preparado](19-DEPLOY-ROLLBACK-E-INCIDENTES.md)                         | PASS como documento | Ensaio/autoridade/ambiente continuam pendentes                                       |

Os skipped são leitura nativa de clipboard Firefox em JSON/UUID, por limitações de permissões do runner. Cópia real passou em Chromium desktop/mobile; valores entregues à API e fallbacks são instrumentados nos três projetos. Nenhum teste foi removido, ignorado adicionalmente ou enfraquecido nesta revisão.

## Lighthouse: condições e resultados

Lighthouse **13.6.0**, licença Apache-2.0, consultado no registro oficial e executado via `pnpm dlx`, isolado do aplicativo/lockfile. Ambiente: Windows, Node 24.22.2, Chromium/HeadlessChrome **156.0.0.0** do Playwright. Uma navegação por página, sequencial, perfil temporário, sem entradas reais e sem E2E concorrentes durante a coleta. Mobile simulado: viewport 412×823, DPR 1,75, throttling `simulate`, RTT 150 ms, throughput 1.638,4 Kbps e CPU ×4. Não representa dispositivo físico, variabilidade de várias execuções ou ambiente público.

| Página         | Performance | A11y | Boas práticas | SEO bruto | LCP simulado |  TBT | CLS |
| -------------- | ----------: | ---: | ------------: | --------: | -----------: | ---: | --: |
| Home           |         100 |  100 |           100 |        91 |       756 ms | 0 ms |   0 |
| JSON           |         100 |  100 |           100 |        91 |       757 ms | 0 ms |   0 |
| Base64         |         100 |  100 |           100 |        91 |       756 ms | 0 ms |   0 |
| Componente URL |         100 |  100 |           100 |        91 |       756 ms | 0 ms |   0 |
| Timestamp      |         100 |  100 |           100 |        91 |       755 ms | 0 ms |   0 |
| UUID           |         100 |  100 |           100 |        91 |       755 ms | 0 ms |   0 |
| SHA-256        |         100 |  100 |           100 |        91 |       757 ms | 0 ms |   0 |
| Privacidade    |         100 |  100 |           100 |        91 |       753 ms | 0 ms |   0 |

Não há INP/CWV de campo, medição de processamento/cópia nesta coleta nem score de produção. Performance da navegação não demonstra responsividade sob toda entrada possível. O auditor recomenda reduzir cerca de 40 KiB de JavaScript não usado na navegação da home; isso inclui código do runtime compartilhado, não prova que se pode removê-lo sem afetar interação. Sem alteração de arquitetura motivada apenas pelo diagnóstico.

Em todas as páginas, `audits['robots-txt'].explanation` informa `Network.loadNetworkResource ... CSP violation`. A CSP `connect-src 'none'` bloqueia o fetch do próprio auditor. Inspeção HTTP independente retornou **200, text/plain**, conteúdo `User-agent: *` / `Allow: /`, igual a `dist/robots.txt`. O score 91 é preservado como resultado bruto, sem reclassificação para 100 e sem liberar conexões para elevar nota. Canonical e sitemap continuam pendências reais distintas desse alerta.

Primeira tentativa de CLI falhou porque o PowerShell expandiu a lista de categorias sem aspas; refeita com argumento único e relatórios completos. Não houve resultado inventado para a tentativa inválida.

### Reproduzir a coleta local

Com build/preview em `127.0.0.1:4321` e Chromium instalado, usar Node/pnpm nas versões do projeto. `CHROME_PATH` deve apontar para o executável Chromium/Chrome apropriado. Não auditar uma sessão com dados reais.

```powershell
$env:CHROME_PATH = 'CAMINHO_DO_CHROMIUM_DE_TESTE'
pnpm dlx lighthouse@13.6.0 http://127.0.0.1:4321/ --chrome-flags="--headless --disable-gpu" "--only-categories=performance,accessibility,best-practices,seo" --output=json --output=html --output-path=.tools/p4-lighthouse/home --quiet
```

Repetir para as seis rotas e `/privacidade/`, com caminhos de saída distintos. O CLI é ferramenta de medição, não dependência enviada ao navegador. Relatórios HTML/JSON permanecem locais. Não usar serviço PageSpeed remoto para conteúdo de ferramentas.

## Revisão de segurança — SEC01–SEC16

Não foram confirmados achados críticos/altos no código e nos testes locais inspecionados. Ausência de achado não comprova ausência de vulnerabilidade. Source scans e teste de payload não substituem revisão especializada ou segurança da hospedagem.

| Controle                  | Evidência/limite                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC01 processamento local | Fonte sem fetch/XHR/WebSocket/sendBeacon de conteúdo; E2E sem requests durante as ações                                                                     |
| SEC02 memória volátil     | Inputs/outputs fora de storage/cookies/URL; reload limpa estado; tema é a única persistência intencional                                                    |
| SEC03 XSS                 | React trata entrada como texto; payloads não criam imagem/script; sem innerHTML/eval em `src/`                                                              |
| SEC04 limites             | 1 MiB UTF-8; JSON 8 MiB de saída pela ADR; expansões derivadas/cap de UUID; testes de fronteira                                                             |
| SEC05 regex               | Nenhum executor de regex fornecido pelo usuário; gramáticas fixas e limitadas revisadas, sem evidência de ReDoS nesta análise                               |
| SEC06 Web Crypto          | UUID/SHA-256 nativos e erro de contexto/API; localhost seguro testado, HTTPS de produção pendente                                                           |
| SEC07 dependências        | Lockfile/instalação congelada/audit executados; sem alerta conhecido nesta data                                                                             |
| SEC08 CI                  | `.github/workflows/ci.yml:9` com `contents: read`, actions fixadas por SHA e gates sem continue-on-error; execução remota/branch protection não verificadas |
| SEC09 CSP                 | `astro.config.mjs:12`; hashes em todas as páginas, sem unsafe-inline/eval, navegação/hidratação passaram                                                    |
| SEC10 headers             | `public/_headers:2–6` revisado; aplicação HTTP real NOT RUN; sem afirmar frame-ancestors por meta                                                           |
| SEC11 terceiros           | Resources locais nas 9 rotas; fonte sem analytics/fontes/CDNs; injeções da conta Cloudflare futuras não verificadas                                         |
| SEC12 erros               | Mensagens locais, sem input em logs de produção; exceções nativas não enviadas a serviços                                                                   |
| SEC13 links               | Links/âncoras internos reais verificados; sem links externos dinâmicos de entrada                                                                           |
| SEC14 JSON                | Parse/stringify nativos, sem merge de objetos não confiáveis; **proto**, Unicode, profundidade/expansão cobertos                                            |
| SEC15 SEO/dados           | Nenhuma entrada em metadata/query/canonical; dominio/canonical/sitemap reais ainda pendentes                                                                |
| SEC16 incidentes          | Guia de triagem/rollback preparado; responsáveis, canais e ensaio não inventados                                                                            |

Inspeção limitada de segredos no build: nenhum padrão encontrado para chave privada PEM, access key AWS de formato AKIA ou token GitHub clássico de formato ghp. Nenhum `.env*` encontrado no escopo de fonte consultado, sem ler arquivos de ambiente reais. Isso não constitui varredura completa de credenciais. Build sem source maps; não há backend/auth/API na aplicação.

## UX, visual e lacunas priorizadas

Capturas atuais reais da home, JSON e UUID mobile foram inspecionadas, além dos registros anteriores das demais ferramentas. Diretórios correspondentes em `test-results/`; temas e estados de erro/sucesso são cobertos por axe/E2E. Catálogo mostra seis funções reais, sem métricas/depoimentos inventados, cards de funções futuras ou recursos apresentados como prontos. Entradas/saídas e ações mantêm hierarquia consistente, foco, labels e feedback.

Não foram reproduzidos cinco defeitos de UX para listar como fatos. Há uma observação de melhoria de baixo impacto e quatro lacunas de evidência, distinguidas abaixo. Nenhuma exige mudança de stack.

| Item                             | Natureza/prioridade                           | Evidência, impacto e próximo teste                                                                                                                                                                                          |
| -------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Erro JSON sem posição            | Confirmado, baixa, não viola o aceite vigente | `src/lib/tools/json.ts:97`; `{"a":1,}` gera mensagem geral sem linha/coluna. Pode aumentar busca visual em textos longos. Avaliar posição somente se calculada com segurança e testar navegadores/Unicode sem revelar input |
| Leitor de tela                   | Lacuna de evidência, média                    | Axe/labels/teclado passaram; ainda executar NVDA/Chrome ou VoiceOver/Safari para confirmar anúncios, foco e seleção                                                                                                         |
| Zoom real                        | Lacuna de evidência, média                    | CSS viewport e raiz 200% passaram; zoom nativo 200–400% ainda precisa de verificação, sem equivalência automática                                                                                                           |
| Uso em dispositivo físico/Safari | Lacuna de evidência, média                    | Emulação mobile usa Chromium; confirmar touch, clipboard, SubtleCrypto e fusos na matriz de suporte decidida                                                                                                                |
| Compreensão e confiança          | Lacuna de pesquisa                            | Sem participantes, não há prova de compreensão em 5 segundos nem validação de H1–H6; executar tarefas sintéticas observadas                                                                                                 |

Uma hipótese visual sobre rolagem inicial do exemplo JSON não foi reproduzida no ensaio focado: `scrollLeft` 0 em 1440→375 px e em abertura direta a 375 px. Registro em `.tools/p4-ux-observations.json`. Não foi transformada em bug confirmado nem motivou alteração de UI. Linhas longas podem exigir rolagem interna conforme o contrato do editor.

### Sessões exploratórias propostas, não realizadas

Convidar 5–8 participantes voluntários com perfis distintos; observar localizar JSON e corrigir entrada inválida sintética, converter Base64 com acentos e timestamp com duas unidades. Acrescentar uma tarefa curta de UUID/hash para avaliar cópia e entendimento dos limites. Registrar tempo, tentativas, necessidade de ajuda e comentários espontâneos, distinguindo observação de interpretação. Não coletar tokens/logs reais nem gravar tela/voz sem consentimento. Nenhum convite ou mensagem foi enviado nesta etapa.

## Ações para passar de candidata local a release

1. Versionar/revisar a origem e executar CI remoto; decidir matriz de navegadores e concluir as verificações manuais/pesquisa ou registrar aceite explícito de pendências.
2. Definir domínio/ambiente e preparar canonical/sitemap/robots verdadeiros em mudança revisável. Não há domínio fictício no produto atual.
3. Revisar o [guia de deploy/rollback/incidentes](19-DEPLOY-ROLLBACK-E-INCIDENTES.md) e autorizar a implantação concreta; validar HTTPS, headers, ausência de injeções, fluxos e Lighthouse real antes de divulgação.

Essas ações não foram executadas automaticamente. O NO-GO atual decorre de gates incompletos de publicação, não de uma vulnerabilidade crítica/alta confirmada no código local.

## Arquivos desta etapa

Novo `tests/e2e/release.spec.ts`, este relatório e o guia operacional. Atualizados README, andamento do plano e nota histórica de US06. Fonte de produção, dependências, lockfile, CSP/headers e configuração de deploy preservados. `git diff`/whitespace e arquivos novos revisados; o repositório segue sem commit inicial ou remote.

Referências: [Lighthouse oficial](https://developer.chrome.com/docs/lighthouse/overview), [alerta robots do Lighthouse](https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/) e fontes Cloudflare ligadas no guia operacional.
