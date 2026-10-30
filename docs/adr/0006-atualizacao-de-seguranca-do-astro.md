# ADR-0006 — Atualização da linha Astro por segurança

Data: 2026-10-30. Status: **aceita pela pessoa responsável e implementada com validação local em 2026-10-30**.

## Contexto e evidência

O contrato original exigia Astro 6 e patches corrigidos, e bloqueava releases com vulnerabilidades críticas/altas sem mitigação aprovada. Na inspeção da base inicial, o registro npm fornecia Astro **6.4.8** como maior versão estável da linha 6. O scaffolding inicial usava essa versão e `@astrojs/react` **5.0.7**, ambos com Vite 7. Este contexto descreve o diagnóstico anterior à decisão abaixo; a política de bloquear releases vulneráveis permanece vigente.

A execução de `pnpm audit --audit-level high` encontrou **10 alertas: 1 crítico, 3 altos, 4 moderados e 2 baixos**. O JSON bruto inicial foi preservado em `.tools/audit-initial.json` (artefato local ignorado pelo Git).

| Componente | Achado                                                                                                                                                                                                                              | Correção informada pelo advisory            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Astro      | [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2), crítico: processamento AVIF hostil pelo serviço Sharp                                                                                                     | Astro >=7.2.8, exigindo Sharp corrigido     |
| Sharp      | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c), [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), altos | Sharp >=0.35.5 cobre os três alertas        |
| Astro      | Quatro moderados e um baixo em renderização/atributos, transições e tratamento de base                                                                                                                                              | Correções indicadas na linha 7, até >=7.3.2 |
| esbuild    | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr), baixo, servidor de desenvolvimento Windows                                                                                                                | >=0.28.1                                    |

O app atual é estático, sem uploads, imagens remotas ou transformação de imagens. As pré-condições do alerta AVIF não foram identificadas nos fluxos atuais; isso é análise de alcance, **não aprovação de risco nem audit PASS**. Não houve tentativa de exploração.

## Opções e trade-offs

1. **Recomendada: atualizar para Astro 7 estável corrigido**, mantendo geração estática, React 19 em ilhas, TypeScript 5, Tailwind 4, ausência de backend e a política de dados. O registro npm consultado aponta Astro 7.4.4 e integração React 7.1.2; confirmar peers, advisories e lockfile na execução. Rever Vite/CSP e ferramentas de compilação exigidas pela integração. Atualizar explicitamente os documentos que fixam a linha 6. Custo: alteração da stack mandatória, reteste integral e nova medição de bundle.
2. **Manter Astro 6 e aguardar correções compatíveis.** Preservar o scaffolding apenas para inspeção local; não concluir gate de segurança, publicar ou iniciar a próxima fatia. Eventuais patches/overrides ou mitigação temporária precisam de análise própria e aprovação; não são aplicados por esta proposta.

Não usar `audit --ignore`, relaxar limiar de severidade, omitir dependências da auditoria ou chamar falta de uso do recurso de correção do pacote.

## Decisão e responsável

A pessoa responsável aprovou explicitamente nesta conversa: **“Atualizar para Astro 7 (recomendado)”**. Adotada a opção 1: Astro 7 estável corrigido, com integração React compatível; mantidas geração estática, React 19 em ilhas e todas as demais restrições do projeto. Esta decisão substitui somente a exigência da linha Astro 6 na ADR-0001, no contrato e nos roteiros; não autoriza backend, novas funcionalidades ou publicação.

## Validação e rollback se aprovada a opção 1

- Confirmar versões oficiais e inventário de dependências/licenças/peers; instalar e congelar novo lockfile.
- Manter as restrições de segurança e testar CSP/hidratação no build real.
- Executar instalação congelada, lint, format, tipos, unit, build, E2E e audit; revisar diff, navegação, temas, a11y e bundle.
- Se houver regressão, preservar diagnóstico e corrigir antes do gate. A base Astro 6 não é fallback autorizado de produção; nenhuma publicação foi realizada.

## Resultado da implementação

Instalados Astro **7.4.4** e `@astrojs/react` **7.1.2**, ambos MIT. O grafo ativo resolve Vite **8.3.5** e Sharp **0.35.5** sem overrides. Peers opcionais `oxc-transform-react` e `@astrojs/markdown-remark` não foram adicionados, pois compilação React com memoização e processamento remark não são utilizados.

Instalação congelada, lint, formato, tipos, 6 testes unitários, build e 33 E2E passaram; `pnpm audit --audit-level high` passou sem vulnerabilidades conhecidas. CSP restritiva e arquitetura estática mantidas. Relatório completo e limites em [11 — Migração Astro 7](../11-MIGRACAO-ASTRO-7.md). Não houve publicação.
