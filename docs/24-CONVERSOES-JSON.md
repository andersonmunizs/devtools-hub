# Conversões JSON para CSV, XML e YAML

Data: 2026-10-30. Implementação local autorizada pela ADR-0009, aprovada na conversa. Preserva as alterações locais de tela cheia/indentação/validação/exportação da fatia anterior. Não inclui commit, push ou deploy.

## Comportamento entregue

- Seletor de formato e botão explícito de conversão; CSV também oferece separador vírgula/ponto e vírgula. Opções e avisos ficam acima dos dois painéis, mantendo alinhamento e a ordem Entrada → Formatar → Minificar pelo teclado.
- CSV aceita objeto ou lista de objetos, com união ordenada das chaves próprias; null/ausente viram vazio e objetos aninhados viram JSON compacto. Campos sempre cotados, aspas internas duplicadas, linhas CRLF, sem BOM. A textarea mostra LF conforme normalização do navegador; cópia/download preservam CRLF original. Fórmulas potenciais em strings/cabeçalhos são rejeitadas, inclusive após controles/espaços/caracteres de formatação Unicode. Números JSON negativos são aceitos. Não há promessa universal para leitores de planilha; importar como texto.
- XML 1.0 tipado: raiz json, entry com key para objetos, item para arrays, type em cada nó. Chaves arbitrárias não viram tags. Escaping de texto/atributos e referências numéricas preservam CR e whitespace em atributos. Caracteres XML ilegais são rejeitados sem remoção; nenhum DTD, recurso remoto ou inserção como HTML.
- YAML 1.2, strings/chaves cotadas, indentação fixa de dois espaços, sem aliases/tags customizadas/inferência de datas. Serialização de JSON apenas; não há parsing de YAML do usuário.
- O último resultado válido determina rótulo, tela cheia e arquivo resultado.csv/.xml/.yaml/.json com MIME correspondente, independentemente do seletor atual. Formatar/Minificar/Validar voltam ao resultado JSON. Editar/limpar invalida texto e metadados; resultados de trabalhos antigos são descartados.
- Busca do catálogo encontra JSON por CSV/XML/YAML e exibe a ação Converter, sem cadastrar ferramentas fictícias.

## Recursos e segurança

Entrada 1 MiB UTF-8, saída 8 MiB; conversões limitadas a profundidade 128 abaixo da raiz e 50.000 valores/contêineres, conforme ADR. O emissor incremental não retorna prefixos parciais. YAML verifica previamente uma estimativa conservadora da saída, com strings JSON cotadas e reserva de estrutura/indentação; pode rejeitar uma estrutura cuja saída real coubesse, com explicação explícita. Há contagem final de bytes.

Conversões usam Worker ES local com prazo real de 5 segundos incluindo carregamento inicial. O temporizador é um orçamento de execução, não uma sincronização artificial da interface. Worker é terminado após sucesso, erro, timeout, cancelamento, edição/limpeza ou cleanup. Se indisponível, há erro claro e nenhuma conversão pesada oculta na thread principal. Formatação JSON existente continua disponível. Limites não são promessa de memória máxima do motor/navegador.

A configuração Vite emite Worker ES para permitir o chunk YAML sob demanda. CSP acrescenta somente worker-src 'self'; connect-src 'none', hashes e demais restrições permanecem. O chunk YAML é um arquivo estático local, não um serviço externo. postMessage é comunicação dentro do navegador, sem conteúdo em URLs, logs, requests ou storage. Erros externos são substituídos por mensagens fixas, sem imprimir exceções contendo dados.

As conversões herdam JSON.parse: números grandes podem perder precisão, -0 pode virar 0 e chaves repetidas mantêm a última ocorrência. Números não finitos e Unicode inválido são rejeitados. CSV é deliberadamente uma representação com perda de tipos e da distinção null/ausente; XML tipado não é schema XML de terceiros.

## Dependência aprovada

`yaml@2.9.1`, ISC, sem dependências externas segundo o autor; adicionada diretamente, versão exata e lockfile. Motivo: emissão YAML mantida por biblioteca especializada, com escaping/tipos verificados, sem parser de YAML do usuário. Metadados e licença verificados no pacote instalado. Aviso ISC completo acompanha public/licenses/yaml.txt, distribuído no build; THIRD_PARTY_NOTICES registra o uso. Nenhuma biblioteca nova para CSV/XML.

Medição do build e resultados finais de verificação são registrados abaixo após a execução, sem antecipar sucesso.

## Auditoria de dependências

A instalação aprovada revelou um alerta moderado no grafo de desenvolvimento existente: minimatch 10.2.6, GHSA-g3hv-75wg-m249, usado por ESLint/TypeScript ESLint. O advisory informa amplificação de padrões glob com optimizationLevel >= 2 e correção em 11.0.1. Não é uma dependência de yaml nem recebe entrada JSON do aplicativo. Não foi aplicado override de major sem revisão de compatibilidade. Ferramentas de PRs continuam devendo rodar em ambiente descartável sem credenciais. A correção deve ser tratada em manutenção específica; não alegamos auditoria total sem vulnerabilidades.

`pnpm audit --prod --audit-level high` executado após instalação congelada: sem vulnerabilidades conhecidas. A auditoria total acusou um moderado e nenhum alto/crítico nesta execução. Fonte: [advisory GitHub](https://github.com/advisories/GHSA-g3hv-75wg-m249), consultado em 2026-10-30.

## Verificações já executadas

343 unitários passaram: CSV com caracteres/separadores/colunas/aninhamento/fórmulas/protótipos, fronteiras de entrada, saída CSV exatamente 8 MiB e um byte a mais, saída XML excessiva, limite conservador YAML, 128 níveis, 50.000 nós, escaping, Unicode, tipos, estados de Worker/timeout/cancelamento. YAML emitido é analisado por parser nos testes para conferir tipos e strings ambíguas; XML é analisado independentemente por DOMParser no navegador.

21 E2E direcionados passaram em Chromium, Firefox e mobile: três conversões reais em Worker sob CSP, cópia e download exatos, extensões e rótulos ao mudar opções, parse de XML e preservação de CR em atributos/texto, erros, Worker ausente, cancelamento/edição/limpeza, descarte tardio, timeout, recuperação, teclado, axe e ausência de overflow. Requisições observadas apenas a scripts locais sem corpo/conteúdo; sem fetch/XHR/WebSocket, storage ou parâmetros com dados. Na primeira revisão, lint identificou escapes desnecessários em fixtures; corrigidos preservando seus valores e sem suprimir regras.

Build e instalação congelada passaram. A regressão completa final passou com 337 E2E aprovados e dois skips conhecidos de clipboard Firefox, em 339 casos. A emissão YAML também escapa explicitamente controles/não imprimíveis compatíveis com strings JSON, preservando o valor; estimativa e testes contemplam essa expansão. Leitor de tela humano, Safari físico, verificação no site público e CI remota: não executados nesta alteração local.

## Arquivos principais

Serializadores em src/lib/tools/json-convert.ts; cliente do Worker em src/lib/json-convert-worker.ts e entrada em src/workers/json-convert.worker.ts. JsonTool configura conversões, TextTool propaga AbortSignal/metadados e JsonOutputActions exporta o formato correto. CSS/páginas explicativas/catálogo, testes unitários/E2E, package.json/pnpm-lock.yaml, licença, avisos de terceiros e ADR atualizados. As demais transformações não receberam dependência YAML ou execução em Worker.

## Impacto medido do build final

Chunks reais de produção, minificados / gzip local: serializador YAML 48.049 / 16.328 bytes; Worker 5.511 / 2.717 bytes; ilha JSON 9.812 / 4.074 bytes. São tamanhos por arquivo, não o incremento exato do aplicativo nem o total transferido (há runtime React/CSS/chunks compartilhados). YAML permanece separado e só é carregado ao converter para YAML. Aviso ISC confirmado no artefato em licenses/yaml.txt.

## Conferência final da interface

Após alinhar o rótulo visível com o nome acessível e mover o aviso de download para o feedback abaixo do resultado, build repetido e 74 E2E JSON aprovados (um skip conhecido), incluindo conversores, tela cheia, download/cópia, erros e teclado. Lint e tipos repetidos: zero erros/warnings/hints. Capturas reais finais em .tools/json-convert-desktop.png (escuro) e .tools/json-convert-mobile.png (claro), inspecionadas; um teste adicional da prévia confirmou igualdade das posições verticais das duas textareas no desktop mesmo após o download.

Prévia local: http://127.0.0.1:4321/devtools-hub/ferramentas/json/ enquanto o processo local estiver ativo. Nenhuma evolução JSON local foi enviada ao GitHub ou publicada nesta tarefa. Próximo passo: revisão da prévia e integração/publicação somente quando autorizadas, além de manutenção específica do alerta moderado de desenvolvimento.

## Publicação autorizada — 2026-10-30

Após revisão da prévia, a pessoa responsável solicitou publicar o conjunto local de melhorias JSON, incluindo a remoção da frase do cabeçalho da página JSON. O registro anterior descreve o estado durante o desenvolvimento. Publicação seguirá PR com CI obrigatória e deploy de main, preservando as proteções existentes. Resultados remotos devem ser consultados no PR e no workflow Qualidade; não são antecipados neste commit.
