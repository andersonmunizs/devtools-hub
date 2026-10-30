# 19 — Guia de deploy, rollback e incidentes

Data: 2026-10-30. **Procedimento preparado; não executado.** Nenhum domínio, projeto Cloudflare, publicação ou integração externa foi criado nesta etapa. Use junto do [relatório de prontidão](18-PRE-RELEASE.md).

## Pré-condições de publicação

1. Definir com a pessoa responsável domínio canônico, conta/projeto Cloudflare Pages, origem do código e responsável pelo rollout/rollback. Obter autorização explícita para publicar a candidata concreta.
2. Versionar e revisar a origem, com commit/tag identificável, lockfile e evidências. O workspace atual ainda tem arquivos não rastreados; não é uma release remota rastreável.
3. Resolver os gates de P4: revisão humana, acessibilidade manual/zoom, política para pesquisa exploratória pendente e lacunas do relatório. Reexecutar os gates se o código mudar.
4. Com domínio aprovado, preparar em mudança revisável `site` do Astro, canonical por página e sitemap das páginas indexáveis reais; excluir 404. Atualizar robots com a URL verdadeira do sitemap. Não substituir isso por um domínio fictício.
5. Confirmar que a modalidade de implantação não publica automaticamente commits/PRs sem a autorização prevista pelo projeto. Integração Git do Pages pode publicar a cada push; definir controles antes de habilitar.

## Build reprodutível

Usar Node **24.22.2** e pnpm **11.25.0**, conforme os arquivos versionados. Em checkout revisado:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium firefox
pnpm test:e2e
pnpm audit --audit-level high
```

Qualquer falha interrompe o rollout; leitura nativa de clipboard Firefox tem dois skips documentados e cobertura alternativa nos demais projetos. A auditoria deve ser atualizada perto da publicação; o resultado de 30/10 não é garantia futura.

O artefato publicável é **apenas `dist/`**, incluindo `_headers`, `robots.txt`, favicon, páginas e assets com hash. Não enviar `node_modules`, `.tools`, fontes, relatórios de testes ou arquivos de ambiente. Preservar uma cópia imutável do artefato e seu manifesto SHA-256 por release; registrar runtime, versões, commit/tag, data, projeto e deployment ID. Não incluir conteúdos reais de ferramentas em evidências.

## Cloudflare Pages estático

O projeto usa `output: 'static'`. Na configuração aprovada do Pages, o diretório de saída é `dist`; o comando de build deste repositório é `pnpm build`, após instalação congelada. Confirmar nas logs do ambiente as versões exatas de Node/pnpm e a estratégia de instalação. Se a imagem de build não as suportar, usar um artefato previamente construído em ambiente controlado ou preparar uma configuração compatível para revisão; não trocar a stack silenciosamente.

Não adicionar adapter SSR, Pages Functions, banco, bindings ou secrets de aplicação: o site não precisa deles. O guia oficial do Cloudflare inclui opções de runtime que não fazem parte desta aplicação estática. Contas, DNS, APIs, tokens ou automação de deploy só serão configurados com autorização específica.

Criar uma implantação de avaliação autorizada, verificar seu endereço HTTPS real e só depois promover/publicar conforme a modalidade escolhida. O endereço de avaliação e o canônico podem ter políticas distintas de indexação; decidir antes de divulgação. O primeiro deploy também exige plano de retirada, pois ainda não existe produção anterior para rollback.

## Validação após a implantação, antes de divulgar

Usar o domínio/endereço real aprovado nos comandos abaixo. São exemplos de inspeção, não comandos já executados em produção.

```powershell
$productionOrigin = 'https://DOMINIO_APROVADO'
curl.exe -I "$productionOrigin/"
curl.exe -I "$productionOrigin/ferramentas/json/"
curl.exe -I "$productionOrigin/rota-sintetica-inexistente/"
curl.exe "$productionOrigin/robots.txt"
curl.exe "$productionOrigin/sitemap.xml"
```

Conferir HTTPS e ausência de mixed content; home/seis ferramentas/privacidade com 200, URL inexistente com 404 real e página 404 com `noindex`. Validar assets, favicon, metadados, canonical/sitemap com domínio aprovado e ausência de redirects para domínios inesperados. Conferir que o caminho de sitemap corresponde ao gerado na implementação, podendo ser um índice.

Inspecionar **headers HTTP reais**: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, bloqueio de frame e permissões conforme `public/_headers`. A CSP HTTP `frame-ancestors 'none'` complementa a CSP em meta gerada pelo Astro. Ambas se aplicam; não substituir a política do Astro nem liberar `unsafe-inline`, `unsafe-eval` ou conexões de conteúdo. Preview local do Astro não comprova aplicação de `_headers` pelo Cloudflare.

HSTS depende de domínio HTTPS controlado e decisão específica; avaliar escopo antes de `includeSubDomains`/preload. Não ativar por cópia automática de checklist.

Repetir as seis tarefas com **dados sintéticos**, nos navegadores suportados: exemplos, erro/correção, copiar/selecionar, limpar, refresh, claro/escuro e teclado. Conferir SHA-256/UUID em contexto seguro. Inspecionar console, Network, storage e URL: nenhum conteúdo de ferramenta deve sair do navegador ou ser persistido. Verificar eventual configuração da conta que injete analytics/Zaraz/scripts; manter recursos não aprovados desativados.

Repetir Lighthouse no domínio real e anexar relatórios. O alerta de robots no Lighthouse local deve ser investigado com resposta HTTP independente e contexto da CSP, sem relaxar a política apenas para obter score. Não confundir laboratório com INP/CWV de campo nem auditoria automática com validação de leitor de tela.

## Rollback

**Gatilhos:** resultado incorreto reproduzível, conteúdo transmitido/persistido, execução HTML/JS de entrada, falha crítica de navegação/hidratação, quebra de contexto seguro/CSP ou vulnerabilidade crítica/alta não mitigada. Suspender divulgação e novas promoções; registrar horário e deployment ID sem entradas reais.

Para um projeto já publicado no Pages, escolher uma **implantação de produção anterior bem-sucedida e aprovada** em Deployments → All deployments → menu de ações → Rollback to this deployment, revisar o alvo e confirmar. Deployments de preview não são alvos válidos de rollback. A restauração altera a produção; deve seguir a autoridade definida para a operação. [Procedimento oficial do Cloudflare](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Se não houver produção anterior válida, não improvisar um alvo: aplicar o plano de retirada previamente aprovado ou republicar um artefato estático conhecido e revisado, conforme a modalidade e autorização disponíveis. Não apagar projeto/DNS/arquivos como tentativa genérica de rollback.

Após restaurar, verificar deployment ativo, HTTPS, 200/404, headers, assets e fluxos sintéticos. Comparar o artefato com o manifesto da release restaurada; registrar resultado e decisão de reabrir divulgação. Impedir que uma automação republique a versão defeituosa enquanto a causa é investigada. O procedimento ainda precisa de ensaio em ambiente autorizado.

## Triagem e resposta a incidentes — SEC16

1. Receber o relato e pedir apenas passos e amostra sintética. Não solicitar tokens, senhas, logs de produção ou conteúdo colado real. Não introduzir telemetria para investigar o caso.
2. Classificar impacto: vazamento/XSS/resultado incorreto/contexto seguro quebrado são prioritários; distinguir bug reproduzido de hipótese. Registrar versão/deployment, navegador, horário e evidência mínima com acesso restrito.
3. Conter por suspensão do rollout e rollback/retirada autorizados. Se houver suspeita de credencial exposta, a pessoa responsável pelo sistema afetado deve seguir seu procedimento de revogação; não coletar a credencial no projeto.
4. Reproduzir localmente com fixture sintética e teste de regressão. Revisar fonte, dependências, config e recursos injetados pela hospedagem. Não tratar ausência de erro na auditoria como prova de ausência de risco.
5. Corrigir em mudança delimitada/revisada, executar gates e repetir a validação no ambiente autorizado. Publicar correção somente pela autoridade combinada.
6. Registrar causa, alcance conhecido/desconhecido, medidas tomadas, horários e próximos controles; comunicar por canal aprovado. Não enviar e-mails/mensagens ou atribuir responsáveis fictícios a partir deste guia.

## Referências oficiais

- [Astro no Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Headers no Pages](https://developers.cloudflare.com/pages/configuration/headers/)
- [Rollbacks no Pages](https://developers.cloudflare.com/pages/configuration/rollbacks/)
