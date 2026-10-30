# 02 — PRD, escopo do MVP e critérios de aceitação

## Visão

**DevTools Hub:** ferramentas de transformação e inspeção de dados para desenvolver com menos fricção e maior confiança. Proposta de valor: **rápido, direto, local no navegador, sem cadastro**.

## O que constitui o MVP

**Página inicial** com busca e navegação por categorias; **páginas próprias e indexáveis** para cada ferramenta; explicações concisas; design system consistente; processamento local; testes automatizados; acessibilidade e headers seguros. O foco da primeira entrega funcional é **JSON**, não seis ferramentas simultâneas.

### Ferramentas incluídas (ordem de entrega)

| ID / slug | Ferramenta | Entrada | Saída | Semântica/limites |
|---|---|---|---|---|
| T01 `/ferramentas/json` | Validador e formatador JSON | texto | JSON formatado, compacto ou erro | `JSON.parse`/`JSON.stringify`, não corrigir silenciosamente |
| T02 `/ferramentas/base64` | Base64 ↔ UTF-8 | texto | texto/Base64 | UTF-8 explícito, erro em dados inválidos, sem Base64URL até definido |
| T03 `/ferramentas/url` | Codificar/decodificar componente de URL | texto | texto | `encodeURIComponent`/`decodeURIComponent`; **não** codificar URL inteira |
| T04 `/ferramentas/timestamp` | Conversor Unix timestamp | número + unidade/fuso | data/hora formatada e timestamp | segundos vs ms explícitos; UTC e horário local; validação de faixa |
| T05 `/ferramentas/uuid` | Gerador UUID v4 | quantidade 1–20 | lista de UUIDs | `crypto.randomUUID()` em contexto seguro; cópia individual/total |
| T06 `/ferramentas/hash` | SHA-256 de texto | texto | hexadecimal | `crypto.subtle.digest`, UTF-8; **hash não é criptografia de sigilo** |

**Limites iniciais (reavaliáveis por medição):** entrada de texto de até **1 MiB** por ação (medir em bytes UTF-8, não `length` de JS); processamento explicitamente iniciado pelo usuário; indicar tamanho e impedir execução acima do limite com mensagem compreensível. Especificar limites particulares por ferramenta e evitar congelamento da UI em aparelhos modestos. Não enviar erros contendo trechos da entrada para serviços externos.

## Fluxo mínimo de cada ferramenta

1. Abrir URL direta: título, propósito e nota "Processado no seu navegador" visíveis.
2. Inserir texto ou usar amostra **sintética** fornecida pelo próprio site.
3. Executar ação claramente identificada ou acionar teclado via botão.
4. Resultado com seleção/cópia e feedback acessível; se erro, explicar e preservar entrada.
5. Limpar entrada e saída; voltar ao catálogo; navegar integralmente por teclado.

**Observação:** funções de transformação devem ser puras sempre que possível, retornando sucesso/erro tipados para permitir testes independentes da UI. Nunca “consertar” entrada malformada automaticamente sem avisar.

## Requisitos funcionais transversais

- RF01: catálogo com título, descrição que diga o que faz, categoria e link real para cada ferramenta publicada.
- RF02: filtro de busca por nome/termos alternativos, tolerando maiúsculas/minúsculas; sem chamadas de rede.
- RF03: páginas individuais com `title`, descrição, heading único, exemplos originais e URLs amigáveis.
- RF04: tema claro/escuro com preferência do sistema; persistir **somente a escolha de tema**, nunca input/output; evitar FOUC e respeitar CSP.
- RF05: copiar depende de ação explícita e apresenta mensagem de sucesso ou falha; nunca substituir o clipboard sem intenção.
- RF06: limpar redefine estado na página e remove referências à entrada; não reter histórico de conteúdos.
- RF07: erros reproduzíveis, com texto compreensível; se for possível indicar linha/coluna JSON, somente se posição calculada com segurança/corretamente.
- RF08: UI comunica limites/semântica (segundos/ms, UTC/local, codificação UTF-8 etc.).
- RF09: páginas 404 reais, links sem âncoras quebradas, sem botões decorativos com aparência de interação.
- RF10: interface responsiva 320–1440 px sem overflow horizontal não intencional.

## Histórias e aceite detalhado

**Limite adicional aprovado para US01:** a [ADR-0007](adr/0007-orcamento-de-saida-json.md) estabelece saída de até **8 MiB UTF-8**, com erro explícito e entrada preservada ao exceder. Não truncar resultados. O limite de entrada continua sendo 1 MiB; estruturas que ultrapassem os recursos nativos do navegador retornam erro distinto de JSON inválido.

### US01 — Formatar JSON
**Como** desenvolvedor, **quero** formatar um JSON válido para inspecionar sua estrutura.  
**Aceite:** JSON de objeto/array/string/number/boolean/null válido é reconhecido; preservar semântica de valores conforme comportamento de `JSON.parse` (informar limites de precisão numérica JavaScript); formatar com 2 espaços; opção de minificar; não reordenar chaves sem opção explícita; conteúdo inválido mostra erro e não gera falso resultado; cópia só quando há saída válida; entrada não é transmitida ou persistida; testes para Unicode, arrays vazios, caracteres escapados, JSON inválido e mais de 1 MiB.

### US02 — Base64 de texto Unicode
**Aceite:** texto "Olá, 世界 😀" volta idêntico após codificar/decodificar; Base64 inválido retorna erro, sem mojibake; não supor que `btoa` suporta Unicode diretamente; distinguir Base64 de Base64URL se esse formato for adicionado; round-trip automatizado.

**Política da primeira implementação:** Base64 padrão canônico, com padding quando necessário, sem espaços/quebras de linha e com bits de padding nulos. Não reparar padding ou aceitar Base64URL. Rejeitar surrogates isolados ao codificar e UTF-8 inválido ao decodificar, sem normalização Unicode; preservar BOM inicial. Vazio é válido nas duas direções. Manter entrada máxima de 1 MiB por ação; a codificação gera no máximo 1.398.104 caracteres ASCII, e essa saída pode exceder o limite de uma nova entrada. Os campos multilinha seguem a normalização LF do navegador; o botão Copiar usa o resultado original decodificado, sujeito às regras de clipboard do sistema. Detalhes e evidências em `docs/13-BASE64-US02.md`.

### US03 — Codificação de componente URL
**Aceite:** espaços, `&`, `%`, `?`, `#` e acentos têm comportamento correto em componente; `%` incompleto ao decodificar causa erro explícito; incluir aviso que o utilitário não é um validador de URL nem encoder de URL inteira; testar codificação dupla como situação a explicar, não normalizar sem decisão.

**Política da primeira implementação US03:** usar `encodeURIComponent`/`decodeURIComponent` sem trim, reparação, normalização ou conversão automática de camadas. Espaço codifica como `%20`; `+` decodifica literalmente. Escapes malformados/UTF-8 percentual inválido causam erro; codificar rejeita surrogates isolados. Vazio é válido; BOM é preservado. Entrada de até 1 MiB por ação, saída codificada de até 3 MiB ASCII (limite derivado), que pode exceder uma nova entrada. Campos multilinha normalizam LF, mas o botão Copiar usa o resultado original. A ferramenta não valida URL, não codifica URL inteira nem processa formulários. Ver `docs/14-URL-US03.md`.

### US04 — Tempo Unix
**Aceite:** entrada distingue segundos e milissegundos; conversão UTC e fuso do navegador explicitados; valores inválidos/fora da faixa são rejeitados; datas afetadas por DST são exibidas pela API de data sem inventar deslocamento; output ISO-8601 quando aplicável; sem suposições silenciosas sobre fuso.

**Política da primeira implementação US04:** entrada numérica; unidade escolhida explicitamente pelo botão. Segundos aceitam até três casas decimais com ponto e milissegundos somente inteiros, ambos com sinal opcional. Rejeitar vazio, espaços, vírgula, expoente, precisão excedente e valores fora de ±8.640.000.000.000.000 ms, sem truncamento/arredondamento. Manter 1 MiB de entrada; processar partes decimais com inteiros exatos antes de criar Date. Resultado inclui UTC ISO 8601, horário no fuso identificado por Intl do navegador com era/deslocamento e ambos os valores Unix. Usar regras nativas de horário de verão por instante; não aplicar fuso substituto silencioso. Anos estendidos seguem ISO. Não receber datas locais nem adicionar relógio em tempo real. Ver `docs/15-TIMESTAMP-US04.md`.

### US05 — UUID v4
**Aceite:** `crypto.randomUUID()` usado; gerar de 1 a 20; conferir formato e bits de versão/variante nos testes, sem alegar teste de unicidade matemática; interface mostra aviso de contexto seguro caso API indisponível; evitar `Math.random()` como fallback.

**Política da primeira implementação US05:** quantidade canônica de 1 a 20, sem espaços, sinais, zeros à esquerda ou frações; não truncar nem limitar silenciosamente. Geração exclusivamente via `crypto.randomUUID()` em contexto seguro, nunca automática, sem fallback. Falha descarta resultado parcial. Exemplo define apenas quantidade 3; se há configuração/lista anterior, pedir confirmação. Editar descarta a lista; limpar restaura quantidade 1 e remove resultados/feedback. Cópia individual e total (um UUID por linha), com feedback e seleção manual do texto escolhido; cópia pendente não restaura feedback de estado descartado. Valores apenas em memória; não deduplicar nem alegar unicidade matemática. Ver `docs/16-UUID-US05.md`.

### US06 — SHA-256
**Aceite:** `TextEncoder` e `crypto.subtle.digest('SHA-256', ...)`; resultado hex com 64 caracteres; testar vetor conhecido e Unicode; explicar que hashing não cifra e não substitui password hashing apropriado em backend.

**Política da primeira implementação US06:** texto UTF-8 sem trim, normalização ou BOM adicionado; preservar BOM existente e rejeitar surrogates isolados para evitar substituição silenciosa. Vazio é válido. Limite de entrada existente de 1 MiB e saída de 64 caracteres hexadecimais minúsculos. Campo multilinha segue normalização LF do navegador. Exigir contexto seguro/SubtleCrypto, sem algoritmo alternativo. Cálculo explícito assíncrono, uma execução pendente por editor; editar, limpar e substituir pelo exemplo invalidam resultado/erro pendente, sem prometer cancelar operação nativa. Explicar ausência de sigilo, riscos de entradas previsíveis e inadequação de SHA-256 puro para senhas. Ver `docs/17-HASH-US06.md`.

## Fora do escopo inicial

- Conta, sincronização, favoritos persistentes, banco de dados, upload para servidor, integração com APIs externas, histórico de textos, links compartilháveis contendo input.
- Gerador automático de SQL, editor que executa JS, HTML preview arbitrário, interpretador de regex sem proteção, JWT viewer de tokens reais, “AI chat” no site, marketplace e ads.
- Monetização, comentários, chat, PWA/offline garantido e plugin de navegador.

## Potencial pós-MVP (sujeito a nova especificação de segurança)

Diff textual; regex com **Web Worker isolado, limite de tamanho e timeout por encerramento do Worker**; CSV/JSON; conversão hex/bytes; gerador de payload fake; visualização de JWT apenas com avisos e sem verificação de assinatura. O roadmap **não autoriza** implementar essas ferramentas antecipadamente.

## Requisitos não funcionais

Confiabilidade, privacidade, acessibilidade WCAG 2.2 AA como meta, tolerância a falhas, baixo JS enviado ao navegador, observabilidade sem coletar conteúdos do usuário, bom SEO e capacidade de publicar como site estático. Critérios operacionais detalhados em `docs/03`, `05` e `06`.

## Definition of MVP Done

As seis ferramentas publicadas e funcionais **ou** MVP entregue explicitamente em fases (com catálogo mostrando apenas as já prontas); nenhuma função fake; critérios específicos de cada US aprovados; suíte automatizada e testes manuais executados; produção HTTPS e CSP revisada; avaliação visual de desktop/mobile; documentação operacional de deploy e rollback; sem vulnerabilidades críticas/altas conhecidas sem mitigação.
