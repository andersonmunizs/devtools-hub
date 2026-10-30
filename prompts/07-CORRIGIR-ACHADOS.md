# Prompt 07 — Corrigir achados de revisão sem regredir o sistema

## PROMPT

Corrija **somente** os achados abaixo, aprovados para correção: [COLAR AQUI OS ACHADOS CONFIRMADOS COM ARQUIVOS, EVIDÊNCIAS E PRIORIDADES].

Leia `AGENTS.md` e as seções pertinentes de segurança, UI/UX, PRD e testes. Antes de alterar código, proponha uma sequência mínima de correções e identifique os testes de regressão necessários. Preserve a stack e arquitetura. Não introduza bibliotecas nem altere CSP/controles de segurança sem motivo demonstrado.

Para cada achado:
1. Reproduza o defeito quando viável e crie teste que falhe antes da correção.
2. Faça a menor mudança que remova a causa, não apenas esconda sintoma.
3. Verifique impacto em mobile/desktop, teclado, privacidade, CSP e bundle.
4. Execute lint, format, types, unit, build, E2E e audit, anotando **PASS/FAIL/NOT RUN** reais.
5. Revise `git diff`; informe se algo permaneceu não resolvido.

Não faça `git push`, deploy ou alterações de requisitos sem autorização. Não remova testes por conveniência.
