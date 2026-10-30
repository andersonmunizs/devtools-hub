# 01 — Descoberta do produto e investigação das dores

> **Atenção:** as dores descritas aqui são hipóteses para pesquisa, não fatos comprovados por entrevistas. Não inventar pesquisas, depoimentos, números, NPS ou evidências.

## Problema a investigar

Desenvolvedores e profissionais de TI frequentemente precisam transformar, validar e comparar dados textuais durante debugging, integrações e operação. A hipótese central é que ferramentas dispersas, lentas, confusas ou que não explicam limites criam atrito, erros e preocupação com privacidade.

## Públicos e tarefas reais (JTBD)

| Público | Situação | Trabalho a realizar | Resultado esperado |
|---|---|---|---|
| Desenvolvedor frontend | Testa uma API | Validar/formatar JSON | Localizar erro e ler estrutura rapidamente |
| Desenvolvedor backend | Inspeciona payload | Converter codificação Base64/URL | Confirmar Unicode sem corrupção |
| DevOps/SRE | Analisa logs | Interpretar timestamps e fusos | Converter com unidade/fuso explícitos |
| Analista de integração | Depura dados | Gerar IDs e hashes | Copiar resultados confiáveis com poucos cliques |
| Estudante | Aprende protocolos | Entender o resultado e suas limitações | Explicação curta e exemplos não perigosos |

## Hipóteses testáveis de dores

| ID | Hipótese | Evidência necessária | Impacto possível | Solução a testar |
|---|---|---|---|---|
| H1 | Trocar entre sites interrompe o fluxo de trabalho | Observação de sessões e entrevistas | Tempo/context switching | Catálogo pesquisável e recente sem tracking |
| H2 | Ferramentas online criam receio de colar dados | Relatos e política de privacidade analisada | Desistência, risco de exposição | Processamento no navegador, explicação verificável |
| H3 | Erros são difíceis de diagnosticar | Testes de tarefas com JSON inválido | Retrabalho | Erro com posição, motivo e sugestão segura |
| H4 | Unicode e unidades são tratados incorretamente | Casos reais anonimizados + teste | Resultados errados | UTF-8 explícito, segundos/milissegundos visíveis |
| H5 | Interfaces têm excesso de ruído | Testes comparativos de tempo e usabilidade | Navegação lenta | Layout focado em entrada, ação e saída |
| H6 | O usuário não sabe se a ação funcionou | Observação de tentativa/cópia | Repetição e dúvida | Feedback inline acessível e não intrusivo |

## Protocolo de pesquisa (antes de expandir o catálogo)

- **5 a 8 entrevistas exploratórias**, de preferência papéis e experiência variados; amostra por conveniência, sem alegar representatividade.
- Pedir um exemplo recente de tarefa, não “Você usaria nosso site?”.
- Observar 3 tarefas: validar JSON inválido; converter Base64 com acentuação; converter timestamp em segundos e milissegundos.
- Não coletar código real, tokens, logs de produção ou dados pessoais. Usar amostras fabricadas ou anonimizadas pelo próprio participante.
- Registrar: tempo para encontrar ferramenta, número de tentativas, erros, momentos de dúvida, confiança no resultado e comentário espontâneo.
- Formulário simples e voluntário depois da tarefa; não gravar tela ou voz sem consentimento.

### Perguntas de entrevista (neutras)

1. Conte a última vez que precisou converter, validar ou formatar um dado durante trabalho/estudo.
2. Qual era o objetivo? Qual foi a sequência de passos?
3. O que foi mais demorado ou arriscado? Como percebeu que o resultado estava correto?
4. Que tipo de conteúdo você evita colar em ferramentas externas? Por quê?
5. Que informação de erro faltou quando algo deu errado?
6. O que faria você preferir uma ferramenta local/online ao seu editor?

Evitar perguntas que induzam resposta, como “Você também odeia sites cheios de anúncios?”.

## Priorização

Pontuar cada hipótese com **frequência observada (1–5)**, **severidade observada (1–5)** e **confiança na evidência (0,25 / 0,5 / 0,75 / 1)**. Valor sugerido = frequência × severidade × confiança. São critérios de decisão, **não estatísticas do mercado**. Ajustar após entrevistas.

## Métricas iniciais (sem telemetria invasiva)

- **Sucesso em tarefas moderadas:** 4 de 5 participantes conseguem concluir cada tarefa sem assistência (meta de pesquisa inicial, não resultado).
- **Tempo de tarefa:** registrar manualmente em sessões de teste; comparar com um baseline obtido na mesma sessão.
- **Erros de transformação:** 0 em suíte de casos-limite conhecida; alta cobertura de propriedades essenciais.
- **Tempo de carregamento/performance:** metas em `docs/06` e medição real em dispositivos representativos.
- **Privacidade:** 0 requisições com conteúdo digitado; 0 persistência automática de entradas.
- Não adicionar analytics ao MVP. Se houver necessidade futura de métricas de uso em produção, definir minimização, consentimento/aviso pertinente, retenção e nova revisão legal/segurança.

## Entregáveis de pesquisa

Criar `research/` **somente quando existir pesquisa real**, com `roteiro.md`, `notas-anonimizadas.md`, `achados.md`, `decisoes.md`. Separar explicitamente "observação", "interpretação" e "ação". Nunca fabricar arquivos de entrevista preenchidos.

## Critério para aprovar novas ferramentas

Uma nova ferramenta deve ter pelo menos: tarefa identificada, formato/semântica verificável, casos-limite testáveis, processamento privado possível e vantagem clara sobre adicionar uma nova seção genérica à home. Priorizar correção sobre quantidade.
