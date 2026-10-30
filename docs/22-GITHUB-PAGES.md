# Publicação no GitHub Pages

Destino autorizado: https://andersonmunizs.github.io/devtools-hub/.

A ADR-0008 substitui a hospedagem Cloudflare por GitHub Pages com aceitação explícita da limitação de headers customizados. O arquivo `_headers` não é considerado evidência de headers HTTP nesta hospedagem. A CSP do Astro permanece em meta, com hashes e `connect-src 'none'`; `frame-ancestors` e X-Frame-Options não são garantidos. Referrer-Policy também é definida em meta. O controle de incorporação em iframe permanece uma limitação conhecida, sem scripts de frame-busting.

O build usa `base: '/devtools-hub'`, links sob esse prefixo, canonical HTTPS e sitemap com as oito páginas indexáveis. A 404 é excluída do sitemap e recebe noindex. Desenvolvimento e preview também usam `/devtools-hub/`.

O workflow Qualidade executa scanner, instalação congelada, lint, formato, tipos, unitários, build, E2E e auditoria. Somente push em main após integração por PR pode enviar o artefato dist e executar deploy. PRs não recebem permissões de Pages. As Actions novas são fixadas pelos SHAs dos releases oficiais consultados. O job deploy recebe somente pages:write e id-token:write. Nenhuma dependência de aplicação foi adicionada.

Para verificar uma implantação, consultar Actions/Qualidade e Settings/Pages; acessar home, seis ferramentas, privacidade, sitemap e uma rota inexistente; conferir HTTPS, CSP em meta, assets e operações sintéticas. Headers devem ser inspecionados no endereço real. O GitHub pode registrar IP e metadados de acesso a arquivos; o aplicativo não transmite entradas ou saídas das ferramentas.

Rollback: reverter por PR o commit problemático para uma revisão conhecida, aguardar CI e novo deploy. Para retirar o site urgentemente, usar Unpublish site em Settings/Pages, com autorização do responsável; isso não apaga o código. Não alterar DNS nem remover proteção de branch para contornar a CI.

Guias anteriores de Cloudflare são registros históricos; não descrevem a implantação atual. Testes automatizados não certificam leitor de tela, zoom nativo ou Safari físico, que permanecem limitações da validação disponível.
