# Prompt 04 — Revisão de segurança independente e baseada em evidência

## PROMPT

Atue como **revisor de segurança independente**, sem presumir que as alterações anteriores estão corretas. Leia `AGENTS.md`, `docs/05-SEGURANCA-E-PRIVACIDADE.md`, `docs/06-TESTES-E-QUALIDADE.md` e o diff da feature atual. **Não modifique código nesta revisão inicial.**

Procure especialmente:
- XSS/DOM injection, `innerHTML`, `dangerouslySetInnerHTML`, execução de conteúdo, URLs perigosas, sanitização inadequada de contexto;
- requisições com dados digitados, eventos de analytics/logs, storage persistente, input em query params ou clipboard sem ação explícita;
- dependências/transitivas inseguras, supply chain, scripts externos, segredos no bundle, uso indevido de permissões de CI;
- limites de tamanho, JSON com `__proto__`, Unicode malformado, Base64/URL inválidos, travamentos e regex sem Worker se houver;
- headers Cloudflare, CSP Astro 7, diferenças entre dev/build/deploy, ataques via embeds/cross-origin;
- dados fictícios apresentados como reais, tratamento de erro que mascara falhas, testes enfraquecidos.

**Processo:**
1. Identifique arquivos e linha/trecho; se tiver ferramenta de leitura de arquivos, forneça referências reais, não invente linhas.
2. Para cada achado: severidade [Crítica/Alta/Média/Baixa], categoria, evidência reproduzível, impacto, pré-condições e correção proposta. Diferencie confirmado de hipotético.
3. Mapeie achados para SEC01–SEC16 quando cabível; verifique quais controles foram executados de verdade e quais estão pendentes.
4. Execute apenas verificações de leitura/testes que não alterem infraestrutura, como audit, grep, testes e inspeção de build quando possível; não afirmar que houve pentest completo.
5. Priorize problemas críticos/altos antes de polimento; não sugerir aliviar CSP ou desativar regras como solução automática.
6. Produza checklist de reteste e riscos residuais. **Não faça deploy nem altere código**, a menos que eu peça explicitamente uma implementação de correções em outra tarefa.

Se nenhum achado for identificado, informe escopo efetivamente inspecionado, o que não foi testado e limitações; não alegue "100% seguro".
