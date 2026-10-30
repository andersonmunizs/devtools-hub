# 20 — UI e descoberta das ferramentas

Data: 2026-10-30. Objetivo autorizado: melhorar reconhecimento, busca e navegação antes de tratar GitHub/publicação.

## Diagnóstico e decisões

A home anterior dedicava grande área ao título e à enumeração das ferramentas antes da busca. A lista vertical usava a mesma composição para todas as tarefas, com pouca diferenciação visual. A busca procurava a frase inteira em um único campo: `formatar json` podia falhar mesmo com as duas palavras presentes. O estado vazio não oferecia recuperação direta.

O catálogo recebeu ícones Lucide específicos (JSON, binário, link, relógio, impressão digital e hash), cores discretas de apoio, nomes técnicos e ações visíveis. Ícones e cores são redundantes com texto, nunca o único meio de distinguir funções. Seis entradas correspondem às seis funções reais; não há cards promocionais ou funções futuras.

Desktop usa duas colunas para permitir comparar opções sem uma lista excessivamente longa. Mobile usa uma coluna com descrição e ações ocupando a largura completa. A inspeção da primeira versão revelou desperdício de espaço ao manter essas informações indentadas sob o ícone; isso foi corrigido. A introdução e o cabeçalho foram compactados, e a enumeração repetida das ferramentas foi removida do hero.

Busca combina termos entre nome, descrição, categoria e palavras alternativas, ignorando caixa/acentos. Não é busca semântica nem correção automática de qualquer frase. Exemplos deliberados: `formatar json`, `converter data`, `parametro url`, `gerar uuid`, `calcular hash`. Filtros nativos de categoria são combinados com o termo, têm estado `aria-pressed` e não geram URLs ou persistência. Limpar busca/filtros restaura todas as ferramentas e devolve foco ao campo. Os links continuam disponíveis sem JavaScript; filtros ficam desabilitados nesse caso.

## Aceite e verificação

Critérios: seis entradas reais com ícones distinguíveis; busca por tarefa e acentos; filtro combinado; recuperação de nenhum resultado; navegação por teclado; contraste AA automatizado; layout de 320 a 1440 px e reflow; regressões das seis ferramentas. Nenhum pacote, backend, recurso remoto ou mudança de processamento foi necessário.

Testes novos cobrem busca com múltiplos termos, palavras sem acento, ausência de combinação, filtros, estado vazio, recuperação/foco e abertura da ferramenta correta. A suíte existente verifica privacidade, CSP, claro/escuro, axe, links, metadata, ausência de JavaScript e tamanho das telas. Capturas reais da home desktop/mobile/escuro foram inspecionadas; os resultados finais estão registrados na conversa da execução.

Resultados: lint/tipos/formato e build passaram; **280 testes unitários** e **298 E2E aprovados**, com os **2 skips preexistentes de leitura nativa de clipboard Firefox**, em 300 casos nos três projetos. Após o refinamento mobile, o build e toda a suíte E2E foram repetidos; capturas finais inspecionadas. Sem alteração de testes para reduzir exigências de acessibilidade, privacidade ou funcionamento.

A avaliação é uma revisão de engenharia/design com testes reais, não pesquisa com participantes. Não se afirma redução medida de tempo de tarefa ou validação por usuários. Leitor de tela e zoom nativo continuam pendentes. As medições Lighthouse e o manifesto de P4 em `18-PRE-RELEASE.md` descrevem o build anterior e não devem ser atribuídos automaticamente a esta interface.

## Arquivos

`SearchTools.tsx`, `search-tools.ts`, `tools.ts`, home, CSS global, testes unitários de busca e novo E2E de descoberta. Direção visual preserva tokens, tipografia local, foco e ausência de animações ornamentais. Esta entrega concentra a melhoria geral na navegação e descoberta; fluxos internos das ferramentas mantêm seu comportamento validado.

Próximo passo de UX: avaliar a nova home em tarefas sintéticas e usar as dificuldades observadas para orientar refinamentos dos editores. GitHub e publicação não fazem parte desta entrega.
