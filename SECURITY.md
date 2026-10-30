# Segurança

## Escopo

DevTools Hub é uma aplicação estática em pré-release. A linha atual na branch principal recebe correções; não há promessa de suporte a versões históricas nem prazo fixo de resposta. Entrada e saída de ferramentas devem permanecer apenas na memória do navegador. Consulte `docs/05-SEGURANCA-E-PRIVACIDADE.md` para o modelo de ameaças.

## Relatar uma vulnerabilidade

Use [Security → Report a vulnerability](https://github.com/andersonmunizs/devtools-hub/security/advisories/new). O relato privado foi habilitado e confirmado pela API do GitHub em 2026-10-30; nenhum relato fictício foi enviado. Esse recurso depende da configuração do proprietário, não apenas deste arquivo.

Se o botão não estiver disponível, abra somente uma issue solicitando um canal privado de segurança, **sem detalhes exploráveis, credenciais, dados pessoais ou payloads de sistemas reais**. Aguarde o canal antes de enviar os detalhes.

No relato privado, informe versão/commit, navegador, passos reproduzíveis com amostras sintéticas, comportamento esperado/observado e impacto. Não envie segredos ou entradas reais de ferramentas. Teste apenas instâncias sob sua autorização e evite testes que interrompam serviços de outras pessoas.

## Se um segredo for exposto

O responsável pela credencial deve revogá-la/rotacioná-la. Remover a linha ou reescrever um commit não invalida uma credencial. Avalie também histórico, branches, tags, logs e artefatos. Coordenar eventual limpeza de histórico antes de executá-la; não apagar evidência indiscriminadamente.

## Verificações

Execute `pnpm check:public` e `pnpm audit --audit-level high` antes de publicar alterações. O primeiro inspeciona arquivos candidatos, index e objetos do histórico local alcançável, com diagnósticos sem valores de segredos. Ele usa padrões limitados e não comprova ausência de credenciais. Mantenha secret scanning e push protection do GitHub habilitados conforme disponibilidade/configuração da conta.
