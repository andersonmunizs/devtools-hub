# 08 — Registro de decisões (ADRs) e referências técnicas

## ADR-0001 — Escolha de Astro static-first

- **Status:** aceita para MVP.
- **Contexto:** ferramentas independentes, processamento no navegador e páginas públicas indexáveis.
- **Decisão:** Astro 7 para conteúdo e páginas; React 19 apenas para formulários; geração estática. Linha principal atualizada com aprovação em 2026-10-30 pela [ADR-0006](adr/0006-atualizacao-de-seguranca-do-astro.md); demais decisões preservadas.
- **Benefícios:** baixo JS inicial, SEO/HTML, operação sem servidor e superfície de ataque menor.
- **Custos:** integração de dois frameworks, CSP e hidratação devem ser testadas.
- **Rejeitados por ora:** Next.js com React Server Components (complexidade e superfície de servidor desnecessárias); SPA React+Vite pura (simplicidade boa, mas páginas individuais exigiriam cuidados adicionais para HTML/SEO).
- **Rever se:** casos reais exigirem serviços de backend/SSR ou a integração demonstrar custo excessivo.

## ADR-0002 — Nenhum backend ou banco inicialmente

- **Status:** aceita.
- **Justificativa:** não há necessidade de conta ou dados persistentes para transformações locais.
- **Consequência:** conteúdo do usuário não deve ser capturado em network/logs; hospedagem pode registrar acessos técnicos a assets.
- **Rever se:** funcionalidades aprovadas exigirem persistência e houver novo threat model.

## ADR-0003 — Sem editor pesado por padrão

- **Status:** aceita.
- **Decisão:** `textarea` bem acessível e output em texto; sem Monaco/CodeMirror até haver dado de necessidade.
- **Consequência:** menos recursos avançados inicialmente, melhor carga/controle.

## ADR-0004 — Sem persistência de conteúdo

- **Status:** aceita.
- **Decisão:** somente preferências inocentes de tema podem ser salvas, sem dados de ferramentas.
- **Consequência:** reload perde o conteúdo. Explicar como parte da proposta de privacidade.

## ADR-0005 — Escolha de dependências

- **Status:** procedimento obrigatório, versões exatas pendentes do setup.
- **Decisão:** usar releases estáveis e patches corrigidos compatíveis, fixar versões efetivas e lockfile; checar React/Astro/advisories antes de publicar.
- **Consequência:** sem pin fictício neste pacote; o Codex deve mostrar versões efetivas instaladas e justificativa.

## Modelo para próximas ADRs

```
# ADR-NNNN — [título]
Data:
Status: proposta | aceita | rejeitada | substituída
Contexto e dor comprovada:
Opções e trade-offs:
Decisão e critérios:
Consequências técnicas, UX, segurança e custo:
Plano de validação/rollback:
Responsável pela decisão:
```

## Referências oficiais verificadas em 2026-10-30

- OpenAI/Codex — `AGENTS.md` e hierarquia de instruções: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Astro 7 — migração: https://docs.astro.build/en/guides/upgrade-to/v7/
- Astro docs — referência CSP `security.csp`: https://docs.astro.build/en/reference/configuration-reference/
- Astro docs — ilhas: https://docs.astro.build/en/concepts/islands/
- Astro docs — integração React: https://docs.astro.build/en/guides/integrations-guide/react/
- Tailwind CSS 4 com Astro: https://tailwindcss.com/docs/installation/framework-guides/astro
- OWASP ASVS 5.0.0: https://asvs.owasp.org/
- OWASP DOM-based XSS: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
- OWASP Web Frontend Security: https://cheatsheetseries.owasp.org/cheatsheets/Web_Frontend_Security_Cheat_Sheet.html
- OWASP HTML5 Security (storage): https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- Playwright Best Practices: https://playwright.dev/docs/best-practices
- Cloudflare Pages Headers: https://developers.cloudflare.com/pages/configuration/headers/
- React Security Advisories (consultar sempre antes de instalar): https://github.com/react/react/security/advisories
- Astro Security Advisories: https://github.com/withastro/astro/security/advisories

**Observações:** links são referências, não evidência de que o site foi implementado, auditado ou testado. A referência do Astro contém recursos por versão; consultar documentação **compatível com Astro 7 instalado** (não versões preview/next). O uso de OWASP ASVS como checklist não constitui certificação de conformidade.
