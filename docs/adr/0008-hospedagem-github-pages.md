# ADR-0008 — Hospedagem no GitHub Pages

Data: 2026-10-30. Estado: aprovada pela pessoa responsável ao solicitar prosseguimento após a explicação da limitação de headers. GitHub Pages substitui Cloudflare Pages para esta publicação.

## Objetivo e escopo

Publicar o site estático existente em `https://andersonmunizs.github.io/devtools-hub/`, usando GitHub Actions e o repositório atual. Não adicionar backend, coleta de dados, dependências de aplicação ou execução de entrada. O deploy deve usar somente uma revisão aprovada, com CI verde e permissões mínimas.

## Alterações necessárias

- Configurar `site` e `base` no Astro e adaptar links, assets, navegação, canonical, robots e sitemap ao prefixo `/devtools-hub/`. Testar também o build e a navegação reais no prefixo, inclusive 404, ilhas React, teclado, mobile e privacidade.
- Preparar workflow de build/deploy com Actions fixadas por SHA, lockfile congelado e permissões de Pages somente no job de deploy. Manter proteção de `main` e não publicar PRs automaticamente.
- Validar o domínio HTTPS real, respostas, CSP, recursos, operações sintéticas e ausência de envio/persistência de dados.

## Risco e decisão pendente

O projeto requer headers HTTP, incluindo `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy` e `Permissions-Policy` (docs/05 e docs/19). O arquivo `public/_headers` é uma configuração do Cloudflare Pages; não há evidência de que o GitHub Pages o aplique. A CSP gerada pelo Astro em meta continua útil, mas `frame-ancestors` não é aplicado em meta. Portanto, uma publicação direta no GitHub Pages pode perder o bloqueio de incorporação em iframe e outros headers, e o requisito de segurança não pode ser declarado cumprido apenas com esse arquivo.

Opções: (1) publicar diretamente no GitHub Pages aceitando documentadamente essa limitação, após confirmar os headers reais; (2) manter Cloudflare Pages, que suporta `_headers`, com o repositório GitHub como origem; ou (3) investigar um proxy com suporte a headers, sujeito a nova configuração e decisão. Não aplicar scripts de frame-busting como substituto de proteção HTTP.

Critérios de aceite: seis ferramentas e navegação funcionais sob o prefixo, build/testes aprovados, HTTPS e CSP verificados no endereço real, privacidade preservada, e diferença de headers tratada por decisão explícita. Sem essa decisão, não afirmar que os requisitos existentes de segurança estão atendidos.

Referências: [deploy Astro no GitHub Pages](https://docs.astro.build/en/guides/deploy/github/), [HTTPS no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).

## Decisão registrada

A pessoa responsável aprovou prosseguir com GitHub Pages após a pergunta explícita sobre a limitação de headers. Aceita-se a ausência dos headers customizados do Cloudflare nesta hospedagem; não se declara equivalência de proteção. CSP em meta com hashes e connect-src none permanece, com Referrer-Policy em meta. A publicação depende de CI aprovada e verificação real de HTTPS, rotas e CSP. Nenhuma certificação de acessibilidade manual é alegada.
