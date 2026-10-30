# 06 — Plano de testes, CI/CD, qualidade e Definition of Done

## Estratégia de testes

Adotar pirâmide pragmática: testes unitários para funções de transformação, testes leves de componente para mensagens/ações, E2E para fluxos críticos e verificações manuais de usabilidade, segurança e acessibilidade. **Nenhum teste automatizado substitui inspeção real.**

## Matriz de testes obrigatórios

| Área | Testes básicos | Negativos/borda | Ambiente |
|---|---|---|---|
| JSON | objeto/array/primitivos, pretty/minify | inválido, chave estranha, Unicode, >1 MiB, profundidade | Vitest e Playwright |
| Base64 | ASCII/acentos/emoji roundtrip | inválido, sequência UTF-8 errada, string vazia, limite | Vitest e Playwright |
| URL | encode/decode componente | `%` inválido, reservado, encode duplo informado | Vitest |
| Timestamp | segundos/ms, UTC/local, ISO | NaN, infinito, negativos, faixa, mudança DST | Vitest e Playwright |
| UUID | formato v4 e variante | crypto indisponível, quantidade fora de 1–20 | Vitest e Playwright |
| SHA-256 | vetores conhecidos e UTF-8 | contexto sem SubtleCrypto, entradas longas | Vitest |
| Catálogo | encontrar e abrir ferramentas reais | termo inexistente, links quebrados | Playwright |
| Privacidade | funcionamento sem requests de processamento | storage, URL e refresh sem input | Playwright / DevTools |
| A11y | labels, foco, teclado, anúncios | contraste, zoom, leitor de tela | axe + manual |
| Layout | 320/375/768/1024/1440 e modo escuro | overflow, saída longa, 200–400% zoom | Playwright + manual |
| Deploy | status 200/404, assets, HTTPS, CSP/headers | CSP violada, links inválidos | preview/prod |

**Casos de referência:** todos os exemplos devem ser sintéticos, ter entrada/saída esperadas verificadas e permanecer no repositório como fixtures. Não usar snapshots gigantescos como único oráculo. Testar propriedades como `decode(encode(input)) === input` apenas quando o domínio e codificação suportam roundtrip.

## Níveis de verificação

1. **Static checks:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`.
2. **Unit:** `pnpm test:unit`; verificar resultados efetivos, não só mocks.
3. **Build:** `pnpm build`; checar páginas geradas em `dist/` e routes/metadata.
4. **E2E:** `pnpm test:e2e` com Playwright apontando para `pnpm preview` do build; CI instala navegadores necessários.
5. **Security:** `pnpm audit --audit-level high` e inspeção de diff/config; triagem de advisories (crítico/alto bloqueia release salvo mitigação documentada com aprovação explícita).
6. **A11y:** `@axe-core/playwright` + navegação sem mouse e testes manuais selecionados.
7. **Performance:** Lighthouse em build/preview e, antes do lançamento, ambiente de produção; informar condições da coleta.
8. **Deploy:** curl/DevTools de headers, CSP, robots, sitemap, favicon, HTML e 404; validar URLs públicas.

O Codex deve criar scripts executáveis no `package.json` e **demonstrar** resultados; se um script não existir, criar/configurar antes de afirmar que passou. Falhas de ambiente devem ser descritas sem disfarçar como sucesso.

## Exemplo de pipeline CI a implementar (especificação, não YAML pronto)

**Gatilhos:** pull request e push em main.  
**Permissões:** `contents: read` por padrão; não usar secrets em workflows de PR não confiável.  
**Execução:** checkout action confiável e mantida, setup Node 24 LTS e pnpm pinado, cache do gerenciador, `pnpm install --frozen-lockfile`, lint, format, typecheck, unit tests, build, browser install do Playwright, E2E, audit, upload restrito de relatórios sintéticos.  
**Falhas:** qualquer etapa crítica interrompe merge; não `continue-on-error` para segurança/testes.  
**Reprodutibilidade:** definir browsers do Playwright e opções de servidor web em `playwright.config`; usar ambiente estável em CI; evitar `waitForTimeout` em testes.

## Exemplo de fluxos E2E

- Home → buscar "JSON" → abrir página → inserir exemplo → formatar → comparar resultado → copiar → limpar → entrada/saída vazias.
- JSON inválido → erro compreensível → input preservado → corrigir → executar → sucesso.
- Injetar trecho HTML malicioso como texto → DOM não executa; não usar `alert` em testes como único sensor de XSS (checar eventos e escapes).
- Preencher texto → refresh → o aplicativo não reidrata via storage; não inserir conteúdo em URL; browser BFCache/autocomplete deve ser avaliado separadamente.
- Teclado: Tab/Enter/Space, campo com label, área de resultado navegável, `aria-live` para cópia e erro.
- Simular viewport mobile e ampliar; botões e textos não se sobrepõem, quebra de conteúdo longo funciona.
- Interceptar tráfego e inspecionar requisições; as ferramentas não devem enviar entradas a terceiros.

## Definition of Done da tarefa (DoD)

- [ ] Escopo vinculado a US/requisito e critérios de aceitação.
- [ ] Implementação completa de ponta a ponta (sem links, botões ou rotas falsas).
- [ ] Casos válidos e inválidos cobertos por testes automatizados.
- [ ] Input hostil, grande e Unicode tratados com limites explícitos.
- [ ] Verificação de privacidade: sem requisição/persistência de conteúdo.
- [ ] Lint, format, tipos, unit, build, E2E executados e resultados registrados.
- [ ] Acessibilidade básica automatizada e teclado verificados.
- [ ] UI analisada em mobile/desktop, claro/escuro, inclusive erro/vazio.
- [ ] `git diff` inspecionado, dependências justificadas, sem código morto.
- [ ] Segurança de app + deploy avaliada; backlog de riscos documentado.
- [ ] Sem screenshot/mock/dado fictício apresentado como funcionalidade real.

## Definition of Release (DoR)

Além de DoD: domínio HTTPS, testes no build real, CSP e headers, performance de produção, SEO, 404, robots/sitemap, checklist de privacidade, processo de rollback, patches de dependências avaliados e revisão de PR. Se houver achado crítico/alto aberto, não publicar sem remediação ou aprovação explícita documentada com mitigação aceitável.

## Relatório final que o Codex deve sempre fornecer

```
Funcionalidade:
Escopo e critérios verificados:
Arquivos modificados:
Comandos executados e resultados (PASS/FAIL/NOT RUN):
Testes manuais realizados:
Resultados de Network/CSP/Storage:
Riscos conhecidos e limitações:
Decisões/ADRs necessários:
Próximo incremento recomendado:
```
