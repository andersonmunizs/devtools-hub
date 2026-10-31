# ADR-0009 — Conversões locais de JSON para CSV, XML e YAML

Data: 2026-10-30. Estado: aprovada pela pessoa responsável: “Aprovar a proposta e implementar”. Contratos, limites específicos, Worker e yaml@2.9.1 autorizados.

## Objetivo e escopo

Adicionar conversões explícitas à ferramenta JSON, preservando as mudanças locais de tela cheia, indentação, validação e download. Sem servidor, chamadas externas, persistência automática ou processamento por tecla. Entrada continua limitada a 1 MiB UTF-8 e saída a 8 MiB, sem truncamento. Resultado identifica o formato real; cópia, tela cheia e download usam rótulo, extensão e MIME correspondentes. Editar a entrada invalida resultado e formato. Mudar uma opção não converte silenciosamente.

Não adicionar conversão inversa, importação de XML/YAML, schema validation, flattening automático ou interpretação de código/fórmulas.

## CSV: contrato proposto

- Aceitar um objeto como uma linha ou um array não vazio de objetos. Rejeitar raízes primitivas, arrays mistos e arrays sem colunas, com orientação útil; não fabricar uma tabela.
- Colunas: união das chaves próprias na ordem da primeira ocorrência, seguindo a enumeração JavaScript. Sem ordenar ou acessar protótipos. Campo ausente e null viram célula vazia; essa perda de distinção é informada antes de converter. CSV não preserva tipos JSON.
- Objetos/arrays em células viram JSON compacto, sem achatamento e sem produto cartesiano. Números e booleanos usam representação nativa; strings são preservadas.
- Separador selecionável vírgula ou ponto e vírgula, padrão vírgula. Cabeçalho incluso; aspas em todas as células e aspas internas duplicadas; linhas CRLF; UTF-8 sem BOM.
- Proteção contra fórmulas: rejeitar a conversão se cabeçalhos ou células string começarem com TAB/CR/LF ou, após espaços iniciais, `=`, `+`, `-`, `@` e variantes de largura cheia. Não inserir apóstrofos/tabs nem alterar dados silenciosamente. Números JSON negativos são literais numéricos, não strings de fórmulas. A mensagem não reproduz o conteúdo suspeito.
- A interface orienta importar CSV como texto e não promete proteção universal de todos os leitores de planilha. A OWASP registra que aspas/escaping sozinhos não resolvem o problema e que não existe sanitização universal para todos os consumidores.

Exemplo:

```json
[
  { "nome": "Ana", "ativo": true },
  { "nome": "Bia", "extra": { "x": 1 } }
]
```

```csv
"nome","ativo","extra"
"Ana","true",""
"Bia","","{""x"":1}"
```

## XML: contrato proposto

Não há schema universal de JSON para XML. Usar um formato tipado e documentado que aceite chaves arbitrárias sem transformá-las em nomes de tags:

- XML 1.0, UTF-8, raiz fixa `json`; objetos têm `entry` com atributo `key`; arrays têm `item` em ordem. Atributo `type` distingue object, array, string, number, boolean e null. Não inventar namespaces, IDs, atributos de negócio ou nomes derivados de entrada.
- Strings são texto escapado; chaves são atributos escapados, incluindo referências numéricas para TAB/LF/CR para evitar normalização. Preservar CR em valores com referência numérica. Sem DTD, entidades externas, XSLT, CDATA ou carregamento de recursos.
- Rejeitar caracteres incompatíveis com XML 1.0, incluindo NUL e surrogates isolados, em vez de apagar/substituir. Valores numéricos não finitos também são rejeitados.
- Saída sempre apresentada como texto, nunca inserida como HTML nem aberta automaticamente como documento executável. Download `resultado.xml`, MIME `application/xml`.

Exemplo de `{ "nome":"Ana", "itens":[1,null] }`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<json type="object">
  <entry key="nome" type="string">Ana</entry>
  <entry key="itens" type="array">
    <item type="number">1</item>
    <item type="null" />
  </entry>
</json>
```

Esse contrato não promete compatibilidade com schemas XML de APIs ou sistemas externos. Essa diferença precisa ficar visível na explicação da ferramenta.

## YAML: contrato e dependência proposta

- YAML 1.2, serialização de tipos JSON apenas, sem aliases/âncoras, tags customizadas, datas inferidas ou funções. Strings e chaves entre aspas para preservar strings como `"true"`, `"01"` e `"2026-10-30"`. Nenhum parsing de YAML informado pelo usuário.
- Usar `yaml@2.9.1` como dependência direta pinada. Metadados consultados no registro npm oficial: versão 2.9.1, licença ISC, repositório `eemeli/yaml`. A documentação do autor informa suporte a navegadores e ausência de dependências externas.
- Motivo: não criar um serializador YAML geral artesanal; usar regras de escaping e emissão mantidas por biblioteca especializada e testar os tipos resultantes. Não instalar até a aprovação desta proposta. O pacote já existe no grafo transitivo local, mas isso não equivale a aprovação para usá-lo no produto.
- Simulação real usando os pacotes já instalados, sem instalação nova: bundle isolado de `stringify`, esbuild/browser/minificado, **49.175 bytes brutos / 16.968 bytes gzip**. Não representa o incremento exato do build Astro final. Carregar a conversão YAML sob demanda a partir de um chunk local, sem CDN; registrar impacto final, licença em THIRD_PARTY_NOTICES e nova auditoria após resolver o lockfile.
- Rejeitar números não finitos e Unicode inválido para evitar resultados não interoperáveis. Download `resultado.yaml`, MIME `application/yaml`.

## Precisão e limites de recursos

As conversões seguem JSON.parse: não preservam dígitos numéricos acima da precisão JavaScript nem múltiplas ocorrências da mesma chave. Informar isso antes de converter e recomendar strings para identificadores exatos. Não afirmar conversão sem perda para CSV. Não alterar o modo Validar, que preserva o texto original.

Proposta de limites adicionais **somente para as conversões**: profundidade máxima 128 e até 50.000 valores/contêineres. Medir a saída incrementalmente nos emissores nativos; para YAML, validar previamente uma estimativa conservadora com strings explicitamente cotadas e indentação fixa, rejeitando estruturas que possam exceder o orçamento antes de alocar a saída expansiva. Informar caso a estimativa conservadora impeça uma saída que talvez coubesse; não apresentá-la como medição exata. Confirmar a contagem final UTF-8.

Executar conversões em Worker local, com encerramento após orçamento de 5 segundos, para não bloquear os controles com trabalho patológico. Mensagens do Worker ficam dentro do navegador e não são rede; não enviar conteúdo a logs, URLs ou storage. Editar/limpar/cancelar ou desmontar termina/descarta trabalho anterior. Revisar a diretiva CSP específica para Worker se necessária, sem relaxar connect-src ou permitir domínios externos. A necessidade e o comportamento reais devem ser demonstrados nos testes.

O limite conservador, o Worker e a dependência representam ampliação de escopo/risco e por isso integram esta decisão. Falta de suporte ao Worker deve resultar em indisponibilidade explicada, sem executar trabalho pesado na thread principal como fallback oculto.

## Critérios de aceite e validação

1. CSV: separadores, CRLF, aspas, Unicode, campo ausente/null, células aninhadas, colunas diferentes, arrays inválidos e cabeçalhos/células perigosos; rejeição sem resultado parcial e sem dados no erro.
2. XML: parse independente por DOMParser no navegador, caracteres escapados, chaves arbitrárias, arrays, null, vazios, CR e rejeição de caracteres ilegais. Payloads HTML/DOCTYPE continuam texto sem execução ou requisições.
3. YAML: parse independente nos testes da emissão, preservando tipos e strings ambíguas, objetos/arrays vazios e Unicode; sem aliases, tags inesperadas ou logs com conteúdo.
4. Testar 1 MiB/8 MiB, fronteiras de profundidade/nós, timeout/cancelamento e respostas antigas após editar/limpar; Worker encerrado no cleanup.
5. Formato e extensão corretos em saída, cópia, tela cheia e download, inclusive após alternar operações; exemplo sintético, estados vazios e erros acessíveis.
6. Executar gates de docs/06, navegação/teclado/mobile/axe, inspeção de CSP/rede/storage, revisão do diff e impacto real do bundle. Preservar testes e mudanças locais da fatia anterior.
7. Primeiro integrar localmente uma fatia por formato, mantendo incompletos ocultos. Não efetuar commit, push ou deploy desta proposta.

## Alternativas e decisão solicitada

Recomendação: aprovar os contratos acima, os limites de conversão, Worker e dependência YAML. Alternativa: revisar o mapeamento desejado de CSV/XML ou limitar a entrega inicial a um formato. Não instalar bibliotecas de CSV/XML, pois APIs nativas e emissores pequenos são suficientes para os contratos restritos propostos.

## Referências

- [OWASP — CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)
- [W3C — XML 1.0](https://www.w3.org/TR/xml/)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Documentação oficial de yaml](https://eemeli.org/yaml/)
- [Código e licença de yaml](https://github.com/eemeli/yaml)
