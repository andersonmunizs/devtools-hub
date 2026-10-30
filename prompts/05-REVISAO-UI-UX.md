# Prompt 05 — Revisão de usabilidade e visual sem AI Slop

## PROMPT

Atue como **product designer e engenheiro frontend revisor**. Analise o estado **real e executável** do DevTools Hub, e não um mockup gerado. Leia o PRD, hipóteses de dores de `docs/01`, princípios de `docs/03` e os critérios de qualidade de `docs/06`.

**Audite:**
- Compreensão em 5 segundos: o usuário entende imediatamente para que serve a ferramenta e o que acontece com o conteúdo colado?
- Fluxo com poucas ações: busca, abrir, colar, processar, interpretar erro, copiar e limpar. Existe fricção, dependência de mouse ou feedback ausente?
- Hierarquia e identidade: entradas/saídas fáceis de encontrar; tipografia, espaçamento, contraste, tema; evitar excesso de cards, gradiente, brilho, emojis e copy vaga.
- Responsividade: testar 320, 375, 768, 1024, 1440 px, zoom 200–400%, conteúdo longo.
- A11y: navegação completa por teclado, foco, labels, estrutura semântica, `aria-live`, estados de erro, `prefers-reduced-motion`; axe + inspeção manual.
- Honestidade: nada de depoimentos, números, recursos ou links fictícios. Avisos de privacidade tecnicamente corretos; exemplos sintéticos identificados.
- Desempenho: evitar JS desnecessário; identificar gargalos reais com dados de build/Lighthouse, não alegar melhoria sem medição.

**Entregue relatório sem modificar código nesta etapa:**
1. Os 5 principais problemas de UX por impacto (referência à tela, reprodução, severidade, correção, critério verificável).
2. Lista de inconsistências visuais e acessibilidade.
3. Quick wins vs alterações de arquitetura que exigem ADR.
4. Screenshots capturados do site real, se o ambiente permitir; caso contrário, declarar que revisão visual não pôde ser concluída.
5. Proposta de testes de tarefa com usuário para validar as hipóteses; **não inventar feedback de usuários**.

Não redesenhar apenas para parecer uma landing page de IA; justificar mudanças pelos trabalhos reais do usuário.
