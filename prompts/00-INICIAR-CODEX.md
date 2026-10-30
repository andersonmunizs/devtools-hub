# Prompt 00 — Sessão inicial com Codex (não codificar ainda)

> Cole **apenas o texto da seção PROMPT** na sessão do Codex iniciada na raiz do repositório. Este é o primeiro comando. Só avance após revisar o plano.

## PROMPT

Você é meu parceiro de engenharia para construir um produto real chamado provisoriamente DevTools Hub.

**Antes de qualquer alteração**, confirme que está na raiz do repositório e que leu `AGENTS.md`. Consulte `README.md` e os documentos `docs/01-DESCOBERTA-E-DORES.md` até `docs/08-DECISOES-E-REFERENCIAS.md` na extensão necessária para esta etapa. **Não escreva código nesta primeira interação.**

Objetivos:
1. Resumir em até 12 tópicos o produto, usuários-alvo, suas principais **hipóteses** de dor (não afirmar pesquisa realizada), valor entregue, MVP e itens fora do escopo.
2. Repetir a stack mandatória e os compromissos de segurança/privacidade, explicando por que Astro static-first + React islands é adequado e quais trade-offs existem.
3. Conferir via documentação oficial, se o ambiente permitir acesso, quais são as versões estáveis e corrigidas compatíveis de Astro 7, React 19, Tailwind 4, Node 24, pnpm e ferramentas de teste. Não invente patches, versões ou auditoria. Liste o que não conseguiu verificar.
4. Propor um plano de implementação em fatias verticais, cada uma com entregáveis, critérios de aceite, testes, riscos e gate. A primeira fatia funcional deverá ser o JSON completo.
5. Mapear ameaças de XSS/DOM injection, exfiltração de conteúdo, persistência indevida, dependências, DoS local, CSP, headers e deploy estático. Não declarar conformidade OWASP automática.
6. Apresentar um checklist anti-AI-Slop específico para o catálogo e página JSON, sem copiar layouts de terceiros.
7. Identificar contradições/lacunas da documentação e propor alternativas com trade-offs. Não alterar a stack nem acrescentar serviços sem aprovação.

Entregue como resposta: **plano, pressupostos, riscos, decisões pendentes e primeiro incremento proposto**. Não crie arquivos ou instale dependências nesta etapa. Se não houver bloqueios críticos, recomende que eu execute `prompts/01-SCAFFOLD-E-BASE.md` na próxima sessão/etapa.

## Resultado esperado

Um plano revisável, não um gerador de 20 páginas, nem um código-fonte inicial incompleto. Sua resposta deve distinguir o que verificou de suas hipóteses e suposições.
