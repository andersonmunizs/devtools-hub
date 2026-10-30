# AGENTS.md — contrato operacional do Codex

Você é o engenheiro responsável por um **produto real**, não um gerador de mockups. Consulte `README.md` e `docs/` antes de alterar arquitetura, dependências ou comportamento de ferramentas. Leia somente os documentos relevantes para a tarefa para preservar contexto; em decisões de alto impacto leia `docs/02` a `docs/06`.

## Prioridades em ordem

1. **Segurança, privacidade, correção dos resultados e acessibilidade**.
2. Resolver tarefas reais de desenvolvedores, com UX eficiente.
3. Simplicidade, manutenção e performance.
4. Consistência visual; evitar padrões repetitivos de “AI Slop”.
5. Velocidade de implementação. Nunca sacrificar os anteriores.

## Stack mandatória

A linha Astro 7 foi aprovada pela pessoa responsável em 2026-10-30 na [ADR-0006](docs/adr/0006-atualizacao-de-seguranca-do-astro.md), substituindo a exigência original de Astro 6 por correções de segurança. As demais restrições permanecem vigentes.

Astro 7, geração estática, React 19 em ilhas, TypeScript strict, Tailwind CSS 4, Node 24 LTS, pnpm, Vitest, Playwright, axe-core, ESLint, Prettier, GitHub Actions, Cloudflare Pages. Não adicionar backend, banco, auth, telemetria ou dependências sem justificativa documentada e aprovação. Resolver versões patches seguras a partir das fontes oficiais, usar `pnpm-lock.yaml` e `pnpm install --frozen-lockfile` na CI. Não introduzir React Server Components.

## Antes de codar

- Inspecione estrutura e padrões existentes. Leia as seções relevantes dos documentos.
- Declare objetivo, escopo, casos-limite, riscos e critérios de aceite.
- Se a mudança alterar escopo, modelo de dados, tecnologia ou risco: escreva proposta de ADR e peça decisão.
- Prefira uma **fatia vertical** pequena e testável; não gere o projeto inteiro numa única tarefa.

## Regras de implementação

- Sem `any` injustificado, `@ts-ignore` automático, `eslint-disable` silencioso, dependências exóticas ou abstrações especulativas.
- Sem `eval`, `new Function`, `dangerouslySetInnerHTML`, inserção de input com `innerHTML`, execução de código informado pelo usuário ou links `javascript:`. Valores do usuário são **dados não confiáveis**, mesmo quando permanecem no navegador.
- Nunca enviar entrada/saída de ferramentas a servidores, analytics, logs, rastreamento de erros ou URLs. Não armazená-la em `localStorage`/`sessionStorage`/IndexedDB; memória volátil apenas. Não adicionar compartilhamento via URL com conteúdo.
- Evite chamadas externas; fontes e recursos hospedados localmente. Se um recurso exigir rede, documentar, desabilitar por padrão e solicitar decisão.
- Tratar limites de tamanho, dados malformados, Unicode, acessibilidade, estados vazios, erros e dispositivos móveis.
- Usar APIs nativas quando suficientes. Não inventar criptografia; usar Web Crypto para UUID/hash.
- Evitar `setTimeout` como gambiarra para sincronização, efeitos sem cleanup e atualizações desnecessárias.
- Sem placeholders apresentados como funcionais; feature inacabada = oculta ou marcada claramente como indisponível.
- Manter Astro para conteúdo estático e React só no editor/controles que exigem interação.

## Interface sem AI Slop

- Aplicar os tokens, componentes e fluxos definidos em `docs/03-UI-UX.md`.
- Não criar dashboard fake, métricas falsas, depoimentos inventados, gradientes ornamentais, dezenas de cards idênticos, animações sem propósito ou linguagem publicitária vaga.
- Toda ferramenta deve ter: entrada acessível, exemplos deliberadamente sintéticos, feedback de erro, saída, limpar, copiar com feedback, explicação curta e suporte mobile/teclado.
- Priorizar contraste AA, foco visível, semantic HTML, respeito a `prefers-reduced-motion` e estados de teclado.

## Política de testes e revisão

Para toda funcionalidade, criar/atualizar testes que comprovem aceitação, incluindo sucesso, erro e bordas. Executar os comandos disponíveis de `docs/06-TESTES-E-QUALIDADE.md` e testar a navegação real. Não afirmar que testes passaram se não foram executados. Não apagar, adulterar ou enfraquecer testes para passar CI. Segurança e riscos seguem `docs/05-SEGURANCA-E-PRIVACIDADE.md`.

## Restrição de alterações

- Alterar somente o necessário. Revisar `git diff` antes de finalizar.
- Não sobrescrever mudanças não relacionadas do usuário, nem editar segredos, `.env` reais, configurações de deploy ou políticas de segurança sem explicar.
- Não `git push`, publicar, instalar plugins, criar serviços pagos ou mover dados externos sem autorização explícita.
- Registrar dependências novas com motivo, licença, impacto de bundle e risco.
- No final, responder sempre: **o que foi feito; arquivos modificados; verificações com resultado real; riscos/limitações; próximo passo**.

## Code review rules

Sinalizar como bloqueadores: vazamento de dados de input, XSS, CSP excessivamente aberta, chamadas a domínios não autorizados, exposição de segredos, execução de conteúdo arbitrário, ReDoS sem isolamento, criação de backend sem revisão, autorização incorreta (se adicionada no futuro), botões falsamente funcionais, falha de teste crítico e alegação de verificação inexistente. Sinalizar também regressões de acessibilidade e comportamento.
