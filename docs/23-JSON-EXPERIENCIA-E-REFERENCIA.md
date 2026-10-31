# JSON — ampliação do resultado e recursos de edição

Data: 2026-10-30. Pedido: ampliar o resultado como no JSONFormatter e avaliar seus demais recursos. Objetivo desta fatia: melhorar leitura, validação e exportação sem dependências, processamento remoto ou armazenamento automático.

## Critérios de aceite desta fatia

- Tela cheia ocupa a área da página em diálogo nativo, com tema atual, foco contido, saída por Esc/botão e retorno de foco. Não esconde a interface do navegador via Fullscreen API. O resultado permanece somente leitura, em texto, com cópia e seleção manual.
- Quebra de linhas é visual e não modifica bytes; não construir uma segunda textarea preenchida enquanto o diálogo está fechado. Fechar restaura a rolagem da página.
- Indentação de 2, 3 ou 4 espaços, somente ao processar. Preservar limites de entrada 1 MiB e saída 8 MiB, contabilizando a indentação escolhida, sem saída parcial.
- Validar confirma sintaxe e devolve o texto original sem reserializar números ou chaves repetidas. Formatar/minificar mantêm as regras nativas de precisão já explicadas.
- Baixar JSON exige ação explícita e gera Blob local com nome fixo `resultado.json`, sem conteúdo no nome/URL remota. Revogar object URL. Informar que o navegador/dispositivo controla o arquivo baixado. Editar/limpar invalida saída e ações.
- Sucesso, vazio, erro, Unicode, excesso, teclado, mobile, contraste automatizado, cópia bloqueada e regressão das demais ferramentas devem ser verificados.

## Inventário da referência e próximas fatias

A [página JSONFormatter](https://jsonformatter.org/) foi consultada como referência funcional, sem copiar marca, código ou composição visual. A página descreve validação, formatação/minificação, indentação, árvore/grafo, upload/download, impressão, atualização automática, reparação, conversões e recursos online. Links para outras ferramentas do site não equivalem a requisitos de recriar todo seu catálogo.

| Recurso                                                                                                      | Tratamento                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Tela cheia                                                                                                   | Implementada nesta fatia a pedido da pessoa responsável                                                                          |
| Validar, indentação e download                                                                               | Implementados nesta fatia; formatação, minificação e cópia já existiam                                                           |
| Quebra de linhas                                                                                             | Adicionada à visualização ampliada                                                                                               |
| Árvore recolhível, busca e navegação                                                                         | Próxima fatia proposta; precisa estratégia de renderização para estruturas largas/profundas, sem despejar milhares de nós no DOM |
| Importar arquivo local                                                                                       | Próxima fatia proposta; validar bytes antes da leitura, UTF-8 estrito e confirmação para substituir; nunca enviar arquivo        |
| Imprimir                                                                                                     | Proposta posterior; definir impressão só do resultado e limites de páginas, com informação sobre spool/arquivo do sistema        |
| CSV/XML/YAML e grafo                                                                                         | Escopo separado: definir mapeamento de objetos/arrays, escaping, precisão, limites e eventuais dependências antes de implementar |
| Reparação de JSON                                                                                            | Não corrigir silenciosamente; eventual modo separado exige semântica e decisão explícitas                                        |
| Autoformatação por tecla                                                                                     | Manter processamento explícito conforme UX vigente; avaliar custo e controle antes de mudar                                      |
| Persistência automática, salvar online, compartilhar conteúdo, carregar por URL e preview de imagens remotas | Incompatíveis com as regras atuais de privacidade/CSP. Não implementados                                                         |

Esta é uma entrega incremental; árvore, importação, impressão, grafo e conversores não são apresentados como funcionais. Qualquer expansão de escopo/risco será proposta por ADR antes da implementação, conforme AGENTS.md.

## Arquivos

`JsonTool`, `TextTool`, `JsonOutputActions`, utilitário JSON, CSS específico, página explicativa e testes unitários/E2E. As extensões de `TextTool` são opcionais; as demais ferramentas não recebem controles JSON. Sem alteração de stack, CSP, deploy ou limite de bytes.

## Verificações desta entrega

289 unitários aprovados. A primeira rodada E2E apontou seis falhas nas três variantes: ordem de Tab após a entrada e retorno do foco ao início do diálogo. Corrigidos os controles e o tratamento de Tab/Shift+Tab; os 15 testes direcionados passaram. A regressão completa final passou com 313 aprovados e dois skips conhecidos de leitura de clipboard Firefox, em 315 casos. Capturas reais revisadas em desktop claro/escuro e mobile; axe no diálogo, dimensões exatas da viewport e download Unicode verificados.

Lint, tipos (zero erros/warnings/hints), formato, build e auditoria passaram; scanner público sem achados nos padrões cobertos. A última mudança de texto explica retenção de arquivos na página de privacidade. Sem commit, push ou deploy desta alteração. A versão pública ainda corresponde à revisão anterior. Não houve validação humana com leitor de tela ou dispositivo Safari físico.

Após o aviso de privacidade, o build final foi repetido e passaram mais 12 checks de metadata, links e acessibilidade das páginas em Chromium, Firefox e mobile. Prévia final inspecionada com exemplo sintético em desktop escuro e mobile claro; capturas locais ignoradas em `.tools/json-fullscreen-desktop.png` e `.tools/json-fullscreen-mobile.png`. Prévia disponível em `http://127.0.0.1:4321/devtools-hub/ferramentas/json/` enquanto o processo local estiver ativo.

Prioridade seguinte escolhida pela pessoa responsável: CSV/XML/YAML. Contratos e dependência aprovados na ADR-0009; implementação e evidências em [24 — Conversões JSON](24-CONVERSOES-JSON.md). O inventário acima registra o planejamento da primeira fatia, não a disponibilidade final após essa evolução.
