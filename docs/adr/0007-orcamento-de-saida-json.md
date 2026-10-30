# ADR-0007 — Orçamento de saída do formatador JSON

Data: 2026-10-30. Status: **aceita pela pessoa responsável e implementada com validação local**.

## Contexto e evidência

US01 exige entrada de até 1 MiB UTF-8, formatação nativa com dois espaços e proteção contra consumo excessivo. O limite de entrada não limita a expansão por indentação. O plano `docs/09`, P2, prevê apresentar proposta se a medição mostrar necessidade de novo limite.

Medição local com Node 24.22.2 e dados exclusivamente sintéticos: envolver um array de 5.001 zeros em arrays aninhados e executar `JSON.parse`/`JSON.stringify(..., null, 2)`.

| Níveis externos | Entrada UTF-8 |      Saída UTF-8 | Tempo local aproximado |
| --------------- | ------------: | ---------------: | ---------------------: |
| 64              |  10.131 bytes |    673.711 bytes |                   2 ms |
| 256             |  10.515 bytes |  2.718.127 bytes |                   7 ms |
| 1.024           |  12.051 bytes | 12.370.351 bytes |                  26 ms |

Esses tempos não incluem a renderização nem representam um aparelho móvel. A expansão observada pode pressionar memória e o editor mesmo para entrada muito abaixo de 1 MiB.

## Proposta

- Preservar o limite de **1 MiB de entrada** e a semântica nativa de parse/serialização.
- Limitar a saída a **8 MiB (8.388.608 bytes UTF-8)** por ação, para formatar e minificar.
- Contabilizar a saída durante a serialização, incluindo indentação, chaves, escapes e separadores; interromper antes de produzir um resultado acima do orçamento. Nunca truncar texto nem retornar resultado parcial.
- Mostrar erro acessível e preservar entrada. Sugerir minificar quando apenas a indentação exceder o orçamento; minificar também respeita o orçamento.
- Capturar limitações nativas de profundidade/recursos com erro distinto de JSON inválido, sem tentar contornar com execução de código ou parser alternativo.
- Documentar o limite na ferramenta e testar os dois lados da fronteira e a expansão patológica.

## Alternativas e trade-offs

1. **Adotar o orçamento (recomendado):** mudança explícita de comportamento para resultados muito grandes; mantém a implementação local e sem dependências. Limita expansão, mas não promete limite exato de tempo ou memória do motor JavaScript.
2. **Revisar os limites antes de concluir a ferramenta:** manter a ferramenta fora do catálogo até uma decisão. Não publicar formatação sem proteção nem adicionar Worker/CSP/dependências como substituição silenciosa.

## Decisão e validação

A pessoa responsável aprovou nesta conversa **“Adotar saída máxima de 8 MiB (recomendado)”**. Adotada a opção 1. Não altera stack, armazenamento, rede ou limites das outras ferramentas. A implementação será validada pelos critérios abaixo.

Aceite: resultados abaixo/iguais ao orçamento idênticos à serialização nativa; acima dele retorna erro sem saída parcial; input mantido; UI acessível e responsiva nos casos medidos; testes unitários/E2E, privacidade, CSP e auditoria passam. Sem publicação automática.

## Implementação

O replacer de `JSON.stringify` retorna valores inalterados e contabiliza bytes de literais, chaves, separadores e indentação. Ao exceder 8 MiB lança uma exceção interna capturada, retornando `OUTPUT_TOO_LARGE` sem resultado parcial. Valores numéricos/boolean/null têm literais ASCII e dispensam alocação de buffer UTF-8 por elemento; strings e chaves usam `TextEncoder`. O texto de exceções nativas não é registrado ou enviado.

Testes cobrem entrada ASCII/multibyte de 1 MiB, saída exata de 8 MiB e um byte extra em arrays e objetos com chaves Unicode/escapadas, expansão patológica e limite nativo de profundidade. Ver resultados finais e limitações em [12 — JSON/US01](../12-JSON-US01.md).
