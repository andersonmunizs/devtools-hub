# Prompt 06 — Auditoria final antes de publicar

## PROMPT

Estamos avaliando uma **candidata a release**, não pedindo publicação automática. Leia `AGENTS.md`, `docs/02-PRD-MVP.md`, `docs/05-SEGURANCA-E-PRIVACIDADE.md`, `docs/06-TESTES-E-QUALIDADE.md` e `docs/07-ROADMAP-E-ENTREGAS.md`.

**Objetivo:** determinar com evidências se o projeto está pronto para publicar no Cloudflare Pages como **site estático**.

1. Liste ferramentas realmente prontas; verificar cada rota e critérios específicos. Nenhuma rota ou card incompleto apresentado como funcional.
2. Execute **todos** os scripts de lint/format/typecheck/unit/build/E2E/audit que existirem e valide que scripts esperados estão configurados; capture resultados reais. Não mascarar falha.
3. Verifique output estático `dist/` e presença de páginas/metadata corretas; 404, links, sitemap/robots e canonical (não inventar domínio definitivo).
4. Com `pnpm preview`, teste CSP gerada pelo Astro 7, erros de console e navegação por teclado; examine Network e storage para ausência de envio/persistência de dados digitados.
5. Verifique cabeçalhos `public/_headers` no deploy **somente se houver um ambiente real já disponível**. Não dizer que testou headers Cloudflare ao olhar arquivo local. Se ainda não implantado, marcar NOT RUN e recomendar teste pós-deploy antes de divulgação.
6. Audite dependências e patches, CI (sem permissões amplas), arquivos de segredo, JS bundles e scripts externos. Bloquear release para crítica/alta conhecida não mitigada.
7. Auditoria básica WCAG 2.2 AA e mobile; Lighthouse real, sem fabricar notas. Revisar texto de privacidade: distinguir dados de entrada de logs de infraestrutura.
8. Preparar checklist de rollout e rollback compatível com Cloudflare Pages, sem executar o deploy ou alterar domínio sem minha autorização.

**Entregue tabela com:** requisito, evidência, PASS/FAIL/NOT RUN, severidade, ação corretiva. Depois dê veredito **GO**, **GO condicionado** ou **NO-GO**, justificando qualquer pendência. Não declarar que produção está segura com base somente em checks locais.
