# 09 — Plano de implementação do DevTools Hub

Data: 2026-10-30. Status: planejamento para revisão; desenvolvimento não iniciado.

## 1. Objetivo e diagnóstico do repositório

Construir um hub de utilitários para desenvolvedores em pt-BR, com transformações locais, resultados confiáveis e operação acessível por teclado e dispositivos móveis. Entregar primeiro a base navegável e depois o JSON completo; ampliar o catálogo em incrementos independentes.

Inspeção realizada na raiz `Sugar`:

| Item existente | Papel e situação |
|---|---|
| `AGENTS.md` | Contrato operacional, segurança, stack e critérios de revisão |
| `README.md` | Visão do produto e orientação de execução |
| `docs/01` a `docs/08` | Hipóteses, PRD, UX, arquitetura, segurança, qualidade, roadmap e ADRs |
| `prompts/00` a `prompts/07` | Roteiros para iniciar, implementar, revisar e corrigir |
| `texte.txt` | Arquivo vazio; sem função identificada; preservar |
| `.git/` | Repositório presente; os arquivos de partida aparecem como não rastreados |

Não existem `src/`, `public/`, `package.json`, lockfile, configurações de CI ou suítes executáveis. A documentação descreve um produto futuro, não funcionalidades já disponíveis. Nenhum arquivo preexistente deve ser substituído pelo scaffolding.

Este plano organiza a execução dos requisitos existentes; não substitui o PRD nem altera as ADRs aceitas. As dores H1–H6 continuam sendo hipóteses: não houve pesquisa com usuários nesta tarefa.

## 2. Escopo, arquitetura e limites

- Stack prescrita: Astro 7 estático (atualizado pela ADR-0006 aprovada), React 19 em ilhas, TypeScript strict, Tailwind CSS 4 via Vite, Node 24 LTS e pnpm fixado, Vitest, Testing Library quando aplicável, Playwright, axe, ESLint, Prettier, GitHub Actions e Cloudflare Pages.
- Astro entrega conteúdo, navegação e metadados; React atende apenas interações necessárias. Funções de transformação ficam separadas da UI, com resultados de sucesso/erro tipados.
- A escolha favorece HTML indexável e pouco JavaScript; exige validar integração, hidratação, tema e CSP no build real.
- Entrada/saída somente em memória. Sem rede para processamento, logs de conteúdo, persistência, histórico ou compartilhamento por URL. Apenas a preferência de tema pode ser persistida.
- Limite inicial de texto: 1 MiB (1.048.576 bytes UTF-8) por ação, verificado antes da transformação; execução explícita, nunca a cada tecla.
- MVP: catálogo pesquisável, privacidade, 404 e ferramentas JSON → Base64 → componente URL → timestamp → UUID v4 → SHA-256.
- Fora do escopo: backend, banco, contas, telemetria, upload, execução de HTML/JS, regex, JWT, IA, PWA e ferramentas pós-MVP.
- Nenhuma instalação, implementação, publicação, push ou mudança de infraestrutura faz parte desta tarefa de planejamento.

As versões principais acima são requisitos dos documentos. Patches, compatibilidade e advisories ainda não foram verificados externamente nesta tarefa. A consulta às fontes oficiais será um pré-requisito da instalação; não há afirmação de versões seguras ou auditoria concluída.

## 3. Sequência de execução e critérios de aceite

### P0 — Revisar plano e preparar decisões

**Entregas:** revisar este plano com a pessoa responsável; conferir ambiente Node/pnpm; consultar documentação oficial e advisories; registrar versões propostas, compatibilidade e inventário das dependências com motivo, licença, impacto no bundle e riscos.

**Aceite e verificações:** manter as ADRs aceitas; identificar bloqueios antes de instalar; registrar fontes/data da consulta e qualquer divergência. Atualizar o inventário com versões efetivamente resolvidas e lockfile após o setup.

**Risco/gate:** incompatibilidade ou indisponibilidade de versão mandatória bloqueia a instalação correspondente. Propor ADR com alternativas, sem trocar a stack silenciosamente. Dependências exigem a justificativa e a aprovação previstas no contrato do projeto.

### P1 — Base técnica navegável

**Entregas:**

1. Criar configuração Astro estática, integração React, TypeScript strict, Tailwind, tokens e temas de `docs/03`.
2. Configurar scripts de desenvolvimento, qualidade, Vitest, Playwright sobre build/preview, axe e CI com permissões mínimas e instalação por lockfile congelado.
3. Criar layout, cabeçalho/rodapé, home, busca local, privacidade, 404, favicon e metadados. HTML útil deve existir antes da hidratação.
4. Preparar página JSON de desenvolvimento com aviso explícito de indisponibilidade e sem controles falsos. Catálogo público permanece sem ferramentas até P2; testar seu estado vazio honestamente.
5. Configurar CSP nativa do Astro e `public/_headers` para Cloudflare, conforme `docs/05`. Essa configuração de segurança deve ser explicada na entrega e conferida no build; não prova headers de produção.
6. Atualizar README com execução, comandos, versões instaladas e limites do ambiente local. Não definir canonical ou sitemap com domínio fictício.

**Arquivos previstos:** `package.json`, `pnpm-lock.yaml`, configurações Astro/TS/lint/format/testes, `.github/workflows/ci.yml`, `src/layouts/`, componentes usados, `src/styles/global.css`, `src/data/tools.ts`, páginas, `public/`, testes e README. Criar apenas o necessário ao incremento.

**Aceite e testes:** home, privacidade, JSON indisponível e 404 navegam no preview; tema respeita o sistema e a preferência explícita; foco e contraste são verificados; smoke E2E e axe funcionam; nenhum recurso remoto ou ferramenta falsa aparece. Testes de busca cobrem estado vazio; busca com ferramenta real é concluída em P2. Testar lógica existente, sem teste trivial apenas para preencher a suíte.

**Risco/gate:** tema e hidratação podem conflitar com CSP. Resolver a causa sem liberar `unsafe-eval` ou relaxar políticas indiscriminadamente. Executar os comandos da seção 5 e revisar a base antes de iniciar P2. Não publicar esta etapa como ferramenta funcional.

### P2 — Primeira fatia funcional: JSON (US01)

**Entregas:** função pura com `ToolResult`, validação de tamanho em UTF-8, formatar com dois espaços e minificar via `JSON.parse`/`JSON.stringify`; island React com entrada/saída, exemplo sintético, limpar, copiar, mensagens acessíveis e explicação de limites. Ativar JSON no catálogo e na busca somente após cumprir o aceite.

**Arquivos previstos:** `src/lib/tools/`, tipos e helpers estritamente necessários, componente React JSON, página/registro da ferramenta, fixtures sintéticas, testes unitários e E2E.

**Aceite e testes:**

- Objeto, array e todos os primitivos JSON válidos; `{}`, `[]`, `null`, `true`, `0`, strings, escapes, Unicode/emoji e estruturas aninhadas.
- Entrada vazia, JSON inválido e excesso de 1 MiB apresentam erro claro e preservam a entrada. Testar abaixo, exatamente no limite e acima, inclusive texto multibyte.
- Não executar conteúdo, reparar JSON ou prometer fidelidade numérica além do JavaScript. Explicar serialização nativa e precisão; não adicionar ordenação arbitrária de chaves.
- Testar chaves `__proto__`/`constructor`, payloads XSS como texto, strings longas e profundidade elevada. Medir resposta da UI; registrar limites encontrados antes de aceitar a fatia.
- Erro ou edição da entrada não pode deixar saída anterior apresentada como resultado atual. Cópia só para resultado válido e por ação explícita; falha da Clipboard API deve permitir seleção/cópia manual com instrução acessível.
- Exemplo não sobrescreve entrada preenchida sem consentimento. Limpar remove entrada, saída e feedback.
- E2E: home → buscar JSON → abrir → formatar/minificar → copiar → limpar; inválido → corrigir → sucesso; busca sem resultados; teclado/mobile; rede, storage, URL e reload sem retenção pelo aplicativo.
- Screenshots reais desktop/mobile, axe, contraste e inspeção de console/CSP no build.

**Risco/gate:** tamanho em bytes não limita sozinho profundidade, expansão da saída ou custo de serialização. Se as medições mostrarem travamento, documentar proposta de proteção/isolamento e eventual mudança de limite antes de concluir. Não inventar posição de erro sem cálculo confiável. US01 e verificações transversais devem passar antes de habilitar a ferramenta como pronta.

### P3 — Demais ferramentas, uma fatia por vez

Reutilizar padrões comprovados em P2 sem criar um framework genérico antecipadamente. Cada linha abaixo representa um incremento separado, com função, UI, explicação, testes e revisão próprios.

| Ordem / US | Entrega e aceite específico | Erros, bordas e testes |
|---|---|---|
| P3.1 / US02 | Base64 ↔ UTF-8; roundtrip de `Olá, 世界 😀`; somente Base64 padrão | Vazio, padding/formato inválido, UTF-8 inválido, limite em bytes e Unicode malformado; sem `btoa` direto em Unicode |
| P3.2 / US03 | Codificar/decodificar componente com APIs nativas; aviso sobre URL inteira | Reservados, acentos, espaços, `%` incompleto, codificação dupla e surrogate isolado |
| P3.3 / US04 | Timestamp com segundos/ms explícitos; UTC/local, ISO quando aplicável | Vazio, NaN/Infinity, negativos, limites, frações e DST; política numérica explícita antes da implementação, sem inferência silenciosa de unidade/fuso |
| P3.4 / US05 | UUID v4 com `crypto.randomUUID()`, quantidade inteira de 1 a 20, cópia individual/total | API/contexto seguro indisponível, 0, 21 e frações; validar formato/versão/variante, sem alegar prova de unicidade |
| P3.5 / US06 | SHA-256 com `TextEncoder` e `crypto.subtle.digest`; hexadecimal de 64 caracteres | Vetores conhecidos, vazio, Unicode, limite e API indisponível; explicar hashing e ausência de sigilo |

**Gate por ferramenta:** critérios da US, comandos da seção 5, E2E do fluxo real, erros e bordas, privacidade, teclado/mobile e CSP. Acrescentar rota/card funcional somente ao concluir. Não gerar caminhos públicos de ferramentas futuras via `getStaticPaths()`.

**Riscos:** decodificação permissiva, substituição de Unicode, confusão de unidades/fusos e APIs seguras indisponíveis. Registrar a política de entrada de cada ferramenta antes de codar. Não adicionar fallback criptográfico improvisado ou biblioteca por conveniência.

### P4 — Validação do produto e candidata a release

**Entregas:** revisão de segurança (`prompts/04`), UX (`prompts/05`) e pré-release (`prompts/06`); corrigir achados em incrementos delimitados (`prompts/07`). Preparar guia de deploy/rollback estático, checklist de incidentes e relatório de prontidão.

Realizar, quando viável, 5–8 sessões exploratórias com tarefas e dados sintéticos, conforme `docs/01`. Registrar evidências reais e consentimento aplicável; criar `research/` apenas quando houver pesquisa. Revisar achados antes de expandir o catálogo e antes do lançamento; indisponibilidade de participantes deve permanecer explícita.

**Aceite e testes:** todas as ferramentas anunciadas estão completas; avaliação visual/manual, acessibilidade, SEO, performance de laboratório e auditoria de dependências executadas. Metas de Lighthouse e Core Web Vitals seguem `docs/04`; distinguir laboratório de dados reais de campo. Sem analytics para preencher lacunas de medição.

**Risco/gate:** aplicar Definition of Release de `docs/06`; achados críticos/altos bloqueiam release sem correção ou mitigação com aprovação explícita. Um lançamento por fases pode conter somente ferramentas prontas, desde que a decisão seja registrada claramente. Não publicar automaticamente.

### P5 — Publicação autorizada e validação no domínio real

**Pré-condições:** autorização explícita para publicar, ambiente/domínio confirmados, candidata aprovada e procedimento de rollback revisado.

**Entregas e aceite:** publicar arquivos estáticos em Cloudflare Pages; verificar HTTPS, status 200/404, assets, CSP e headers HTTP reais, inclusive `frame-ancestors`, sem confundir com meta CSP. HSTS depende de domínio HTTPS controlado; não aplicar preload ou `includeSubDomains` sem avaliação. Conferir canonical, robots e sitemap com URLs reais.

Reexecutar fluxos críticos e privacidade no ambiente publicado antes de divulgação. Registrar resultado e reverter a implantação se houver regressão bloqueadora. Sem ambiente publicado, esses controles permanecem NOT RUN, nunca PASS por inspeção de configuração local.

## 4. Lacunas e decisões a registrar antes da fatia afetada

| Tema | Encaminhamento proposto |
|---|---|
| Catálogo JSON em P1 versus proibição de ferramentas incompletas | Seguir a ressalva de `prompts/01`: página de desenvolvimento claramente indisponível; catálogo público só recebe JSON após P2. Sem botão de transformação falso |
| Surrogates isolados e UTF-8 | Definir política por ferramenta antes de implementar; sugerir rejeição explícita onde a conversão perderia fidelidade, em vez de substituição silenciosa. JSON segue semântica nativa documentada |
| JSON: ordem de chaves e precisão | Explicar limites de parse/serialização nativos, inclusive chaves numéricas; não prometer preservação textual ou precisão arbitrária |
| Profundidade, expansão de saída e responsividade | Medir casos hostis até o limite. Se for necessário novo limite, Worker ou mudança de comportamento, apresentar proposta e critérios de reteste |
| Base64 e timestamp | Documentar aceitação de espaços/padding e de frações/sinais/faixas antes da US correspondente; evitar heurísticas implícitas |
| Exemplo e resultado desatualizado | Definir consentimento para sobrescrever entrada e invalidar saída anterior quando não representar mais o estado atual |
| Domínio, conta Cloudflare e marca | Usar DevTools Hub como nome provisório; não inventar domínio, credenciais ou publicação. Resolver antes do release |
| Pesquisa com usuários | Planejar sessões e registrar pendências; não tratar hipóteses como validação concluída |

Esses encaminhamentos são propostas de execução para revisão. Mudanças de escopo, modelo, tecnologia ou risco exigem proposta de ADR e decisão antes da implementação. O plano não aprova dependências adicionais nem altera políticas existentes.

## 5. Verificação obrigatória de cada incremento de código

Após configurar o projeto, executar e registrar os resultados reais:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
pnpm audit --audit-level high
```

O primeiro setup cria o lockfile com versões verificadas; instalações reproduzíveis posteriores e CI usam `--frozen-lockfile`. Configurar os scripts antes de declarar que existem. Testes E2E usam o build servido por `preview`, não apenas o servidor de desenvolvimento.

Complementar com teclado, contraste, zoom de 200%/400%, temas, movimento reduzido e viewports 320/375/768/1024/1440 px. Executar leitores de tela quando disponíveis e registrar ambientes não cobertos. Inspecionar console, Network, storage, URL e bundle com fixtures sintéticas, sem confundir requests normais de assets com envio de conteúdo.

Checklist visual: sem métricas/depoimentos inventados, cards decorativos, links quebrados, controles sem ação, gradientes ornamentais ou texto publicitário vago. Entrada, ação, erro e saída devem dominar a página.

Cada entrega registra arquivos alterados, critérios atendidos, comandos com PASS/FAIL/NOT RUN, testes manuais, evidências, riscos e próximo passo. Revisar `git diff` e arquivos novos explicitamente: arquivos não rastreados não aparecem no diff comum. Não enfraquecer testes nem realizar commit/push automático.

## 6. Registro da etapa de planejamento

- [x] Inspecionar arquivos existentes e ler as especificações e prompts.
- [x] Preparar plano de fatias, testes, riscos e decisões pendentes.
- [ ] Revisar o plano e resolver decisões necessárias ao setup.
- [ ] Verificar versões oficiais, ambiente e dependências propostas.
- [ ] Implementar P1, depois P2; nenhuma ferramenta implementada nesta tarefa.

**Verificação desta tarefa:** revisão documental e inspeção do arquivo criado. Testes de aplicação, audit, build, navegador, Network/CSP/storage e deploy: NOT RUN, pois não há aplicação/configuração executável e esta tarefa é somente de planejamento.

**Próximo passo recomendado:** revisar este plano e iniciar P0/P1 usando `prompts/01-SCAFFOLD-E-BASE.md`, limitado ao alicerce técnico. A primeira entrega funcional será exclusivamente US01/JSON em P2.

## 7. Atualização de execução — 2026-10-30

Após autorização para iniciar, a base P1 foi implementada localmente. Instalação congelada, lint, formato, tipos, 6 testes unitários, build e 33 E2E passaram. O catálogo continua vazio e JSON explicitamente indisponível.

**Gate de segurança bloqueado:** audit reportou 1 crítico, 3 altos, 4 moderados e 2 baixos; a correção oficial do alerta crítico exige linha Astro posterior à mandatória. A [ADR-0006](adr/0006-atualizacao-de-seguranca-do-astro.md) propõe atualização para decisão da pessoa responsável. Não houve migração, aceite dos alertas, publicação ou início de P2.

Ver [inventário, execução e resultados reais](10-BASE-TECNICA.md). As listas e verificações da seção 6 descrevem o momento de criação do plano, preservado como histórico.

## 8. Migração aprovada e validada — 2026-10-30

A pessoa responsável aprovou atualizar para Astro 7. A ADR-0006 foi aceita e implementada com Astro 7.4.4 e integração React 7.1.2; referências normativas do contrato, documentação e prompts foram atualizadas.

Instalação congelada, lint, formato, tipos, 6 testes unitários, build e 33 E2E passaram. Auditoria sem vulnerabilidades conhecidas; bloqueio de dependências da seção 7 resolvido. Ver [relatório da migração](11-MIGRACAO-ASTRO-7.md).

P1 está validada localmente para iniciar a próxima fatia. O próximo incremento é P2/US01, JSON completo. Publicação, headers de produção, pesquisa com usuários e verificações manuais complementares continuam sujeitos aos critérios de suas etapas; nenhum recurso adicional foi implementado nesta migração.

## 9. P2/US01 — JSON completo — 2026-10-30

Implementados parse/serialização nativos, UI de entrada/saída, formatar/minificar, exemplo sintético com confirmação, copiar/selecionar/limpar, erros acessíveis, invalidação de resultado desatualizado, controles de privacidade e integração no catálogo. Somente JSON está habilitado.

A medição demonstrou expansão de 12.051 bytes de entrada para 12.370.351 bytes após indentação. A pessoa responsável aprovou a [ADR-0007](adr/0007-orcamento-de-saida-json.md), limitando a saída JSON a 8 MiB sem mudar a entrada máxima de 1 MiB.

Resultados e limitações em [12 — JSON/US01](12-JSON-US01.md). Próxima fatia prevista: P3.1/US02, Base64 ↔ UTF-8. Não houve implementação das outras ferramentas, publicação, push ou commit.

## 10. P3.1/US02 — Base64 ↔ UTF-8 — 2026-10-30

Implementadas codificação UTF-8 e decodificação estrita de Base64 canônico, erro de UTF-8 inválido, preservação de BOM, tratamento de vazio, limite de 1 MiB, página própria e catálogo com JSON e Base64. O editor de entrada/saída, cópia, limpar e confirmação de exemplo foi extraído para uso real das duas ferramentas, mantendo os testes de regressão JSON.

Sem dependências novas ou mudanças de stack/CSP. Política de padding, Unicode, limites derivados e normalização dos campos multilinha explicitada na página e no PRD. Resultados e limitações em [13 — Base64/US02](13-BASE64-US02.md). Próxima fatia prevista: P3.2/US03, codificação de componente URL. Nenhuma outra ferramenta, push, commit ou publicação nesta tarefa.

## 11. P3.2/US03 — Componente de URL — 2026-10-30

Implementadas codificação/decodificação nativas de um componente, com comportamento explícito para espaço, `+`, UTF-8, escapes inválidos e dupla codificação. Mantidos entrada de 1 MiB, conteúdo volátil, editor compartilhado e controles acessíveis. Catálogo agora contém JSON, Base64 e URL; ferramentas futuras seguem ocultas.

132 testes unitários e 140 E2E aprovados, com 1 skipped já existente de clipboard Firefox; lint, tipos, build, instalação congelada e auditoria passaram. Sem dependências novas, mudança de CSP, ADR necessária ou publicação. Resultados, arquivos e limitações em [14 — URL/US03](14-URL-US03.md). Próxima fatia prevista: P3.3/US04, tempo Unix.

## 12. P3.3/US04 — Tempo Unix — 2026-10-30

Implementada entrada numérica com unidade explícita por botão, precisão de milissegundo sem arredondamento silencioso, UTC ISO 8601, horário no fuso do navegador com deslocamento/era e ambos os timestamps Unix. Inclui negativos, limites de Date, horário de verão nativo e erro sem fallback de fuso. O editor compartilhado recebeu opção de quebra visual para a saída de timestamp em mobile.

Catálogo com quatro ferramentas reais. 194 testes unitários e 179 E2E aprovados, com 1 skipped existente de clipboard Firefox; verificações estáticas/build e auditoria passaram. Sem dependências novas, alteração da stack/CSP ou publicação. Evidências e limitações em [15 — Unix/US04](15-TIMESTAMP-US04.md). Próximo incremento: P3.4/US05, UUID v4.

## 13. P3.4/US05 — UUID v4 — 2026-10-30

Implementada geração nativa com `crypto.randomUUID()` para quantidade de 1 a 20, cópia individual/total, seleção manual, limpar, exemplo de quantidade e controle de resultado/feedback desatualizado. Contexto inseguro/API indisponível impedem geração, sem fallback. Catálogo agora contém cinco ferramentas reais.

243 unitários e 229 E2E aprovados, com 2 skipped de leitura nativa de clipboard Firefox; lint, formato, tipos, build, instalação congelada e auditoria passaram. Sem dependências novas, alterações de CSP/stack ou publicação. Evidências, arquivos e limitações em [16 — UUID/US05](16-UUID-US05.md). Próxima fatia: P3.5/US06, SHA-256.

## 14. P3.5/US06 — SHA-256 — 2026-10-30

Implementado SHA-256 nativo de texto UTF-8, saída hexadecimal de 64 caracteres, vazio válido, rejeição de surrogates isolados e limite de entrada de 1 MiB. Editor compartilhado aceita Promise com bloqueio de execução simultânea e descarte de resultado/erro pendente ao editar, limpar ou trocar exemplo. Sem fallback criptográfico, dependências novas ou alteração de CSP/stack.

Catálogo contém as seis ferramentas previstas. 279 unitários e 286 E2E aprovados, com os 2 skipped existentes de clipboard Firefox; verificações estáticas/build, instalação congelada e auditoria passaram. Evidências e limitações em [17 — SHA-256/US06](17-HASH-US06.md). P2/P3 estão implementadas localmente; a próxima etapa é P4, validação integrada e candidata a release. Publicação P5, HTTPS/headers reais e demais critérios de release continuam pendentes.

## 15. P4 — Auditoria local da candidata — 2026-10-30

Executadas revisões de segurança/UX/pré-release com fonte de produção preservada, inventário do build, Lighthouse mobile nas oito páginas indexáveis e novos testes de metadata, links/âncoras e reflow. 279 unitários e 295 E2E aprovados, com os 2 skips existentes de clipboard Firefox; instalação congelada, lint/formato/tipos/build e auditoria passaram.

Lighthouse local: 100 em performance, acessibilidade e boas práticas, SEO bruto 91 devido ao fetch de robots pelo auditor bloqueado pela CSP; resposta HTTP independente válida, sem relaxar a política. Relatório e limites em [18 — Pré-release](18-PRE-RELEASE.md); procedimento preparado em [19 — Deploy/rollback/incidentes](19-DEPLOY-ROLLBACK-E-INCIDENTES.md).

**Veredito de publicação: NO-GO agora**, por gates ainda não executados: origem versionada/revisada e CI remoto, domínio/canonical/sitemap reais, validações humanas e HTTPS/headers/rollout em ambiente autorizado. Não foram confirmados achados críticos/altos no escopo local. Nenhum commit, push, deploy ou alteração de segurança/configuração de produção nesta auditoria. Próxima ação: resolver esses gates com a pessoa responsável; a candidata local continua disponível para avaliação.

## 16. Refinamento autorizado de UI e descoberta — 2026-10-30

A pessoa responsável priorizou UI/UX antes de GitHub/publicação. Implementados catálogo com ícones e ações por ferramenta, composição desktop/mobile, introdução compacta, busca por múltiplos termos sem distinção de acentos, filtros combinados e recuperação com foco. Justificativas, limites e arquivos em [20 — UI e descoberta](20-UI-DESCOBERTA.md). Sem novas dependências ou alteração do processamento das ferramentas.

## 17. Preparação para repositório público — 2026-10-30

Autorizada a preparação local para GitHub, com segurança. README público, guias de contribuição/segurança, templates, avisos de terceiros, ignores, atributos de texto, Dependabot e endurecimento da CI preparados. Gate sem dependências novas verifica candidatos/index/histórico com diagnósticos redigidos; seis testes sintéticos verificam as proteções. Licença MIT escolhida; identificação pública do titular ainda pendente para finalizar LICENSE. Ver [21 — Repositório público](21-REPOSITORIO-PUBLICO.md). Nenhum commit, remote, push ou deploy criado nesta etapa.

## 18. Publicação do código autorizada — 2026-10-30

Criado [andersonmunizs/devtools-hub](https://github.com/andersonmunizs/devtools-hub) público, MIT com identidade pública `andersonmunizs`, autoria noreply e commit inicial enviado somente em `main`. Proteções de segredos/relatos privados e permissões restritas de Actions configuradas; CI Linux disparada. Reexecutados 286 unitários com sucesso, formato e scanner público sem achados nos padrões cobertos. Registro e limites em [21 — Repositório público](21-REPOSITORIO-PUBLICO.md). Nenhuma implantação do site; domínio, HTTPS, headers e demais gates de deploy continuam pendentes.
