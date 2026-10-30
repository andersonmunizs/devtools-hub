# 21 — Preparação do repositório público

Data: 2026-10-30. As seções de preparação abaixo registram o estado anterior à autorização de publicação; consulte o registro de publicação ao final para o estado atualizado. O site funcionar publicamente é uma decisão separada: domínio, HTTPS e headers não são pré-condições para divulgar somente o código.

## Conteúdo preparado

- README voltado a quem chega ao projeto, com execução, ferramentas, limites, privacidade e links.
- `CONTRIBUTING.md`, `SECURITY.md`, template de PR e issue de bug com orientação para usar dados sintéticos.
- `THIRD_PARTY_NOTICES.md`, com licenças centrais conferidas nos pacotes instalados; a escolha para o código próprio é MIT, aprovada pela pessoa responsável. O nome público do titular ainda precisa ser informado para finalizar `LICENSE`.
- `.gitignore` ampliado para credenciais, configuração da máquina, backups e artefatos; `texte.txt` preservado localmente e excluído do conjunto candidato. `.gitattributes` padroniza texto em LF sem converter binários.
- `pnpm check:public`, sem nova dependência: inspeciona arquivos candidatos, conteúdo do index e blobs do histórico alcançável local. Não imprime valores de segredos. Bloqueia padrões específicos de tokens/chaves, URLs com credenciais, caminhos pessoais absolutos, arquivos privados e arquivos grandes que exigem revisão.
- CI com token somente de leitura, checkout sem credenciais persistidas, histórico completo e gate público antes da instalação de dependências. Actions continuam fixadas por SHA. Concurrency cancela execuções obsoletas; não há deploy nem uso de secrets de aplicação.
- Dependabot preparado para propostas semanais de atualização de pacotes pnpm (ecossistema npm) e GitHub Actions; não faz merge automático nem dispensa revisão de mudança de stack.

`package.json` mantém `private: true`: isso previne publicação acidental no npm e não define a visibilidade do repositório GitHub. Não é necessário adicionar `.env.example`, pois a aplicação não precisa de variáveis/credenciais.

## Inspeção e limites da proteção

Não há HEAD inicial ou remote configurado. Existem referências locais de checkpoint do Codex; a varredura inicial inspecionou **120 blobs de histórico alcançável**, além do conjunto candidato, sem encontrar os padrões procurados. Nenhuma referência foi apagada ou reescrita. O número de objetos pode mudar com checkpoints automáticos; executar novamente antes do envio.

O novo gate tem testes em repositórios temporários sintéticos: fonte limpa/arquivo ignorado, segredo em candidato com diagnóstico redigido, arquivo privado forçado no index, segredo no index com working tree limpo e segredo removido da ponta mas ainda no histórico. Essas fixtures não alteram o histórico do projeto.

O scanner não detecta todos os segredos, dados pessoais em texto livre, conteúdo privado de imagens nem arquivos/refs que não estejam disponíveis no checkout local. `.gitignore` não retira um arquivo já rastreado. Revisão humana, secret scanning e push protection continuam necessários. Se achar uma credencial real, revogar/rotacionar primeiro e revisar a limpeza de histórico; não basta apagar a linha.

Licenças de transitivas e avisos do bundle devem ser revistos na distribuição de artefatos. A tabela de terceiros não é uma certificação jurídica de todo o grafo. Logs, screenshots de testes, binários locais e relatório Lighthouse ficam fora dos arquivos candidatos.

## Conferência antes do primeiro commit

1. Finalizar o titular público da licença MIT. Confirmar que fontes, documentação e exemplos podem ser divulgados; revisar amostras, binários e avisos de terceiros.
2. Executar `pnpm check:public`, instalação congelada e gates do README. Examinar `git status --short` e `git ls-files --cached --others --exclude-standard`. Adicionar somente os diretórios/arquivos revisados, preservando os ignorados.
3. Após preparar o index, executar novamente `pnpm check:public` e revisar `git diff --cached --stat` e `git diff --cached --check`, além do diff completo. Evitar imprimir dados privados em logs de revisão.
4. Definir identidade de commit e e-mail de privacidade/noreply desejados. Não foi alterada configuração global/local de autoria nesta preparação.
5. Criar o commit inicial quando alinhado com a pessoa responsável. Antes de enviar, confirmar a branch e a árvore pretendidas. **Não usar push --mirror, --all ou exportação de refs internas do Codex.**

## Configurações do GitHub a aplicar ao criar o repositório

Estas configurações não foram aplicadas, pois não existe repositório remoto nesta tarefa:

- Confirmar proprietário, nome, visibilidade pública e autoria/licença. Para enviar um histórico local já preparado, criar remoto vazio, sem gerar outro README/licença concorrente.
- Exigir MFA na conta e usar credencial com o menor escopo necessário; não colocar token no remote, nos arquivos ou na documentação.
- Habilitar private vulnerability reporting e testar o acesso ao canal indicado em `SECURITY.md`. O arquivo sozinho não habilita o recurso.
- Habilitar dependency graph, alertas de vulnerabilidades, secret scanning e push protection conforme disponibilidade/configuração da conta. Não configurar serviços pagos sem decisão.
- Manter permissões padrão de Actions de leitura, aprovação para workflows de contribuidores externos e evitar acesso de PRs a segredos. Revisar mudanças de workflows/dependências com atenção especial. Não usar `pull_request_target` para executar código de um PR.
- Criar ruleset/proteção de branch principal: impedir force push/exclusão, exigir checks de qualidade e resolução de conversas. Definir revisão por outra pessoa quando houver revisor; não criar uma regra impossível para uma pessoa mantenedora sem decidir o fluxo.
- Manter auto-merge/desdobramento de deploy desativados até definir explicitamente o processo. Configurar CODEOWNERS apenas com contas/times reais; nenhum proprietário fictício foi adicionado.
- Conferir a primeira execução Linux da CI e Dependabot. Preparar logs/artefatos apenas com fixtures sintéticas e retenção apropriada. Ainda não há execução remota comprovada.

## Estado e próximo passo

Verificações desta preparação: instalação congelada, lint, formato, tipos e build passaram; **286 unitários** (incluindo 6 novos casos de proteção do repositório) e **298 E2E aprovados**, com os 2 skips preexistentes de leitura de clipboard Firefox, em 300 casos. Auditoria sem vulnerabilidades conhecidas. Gate público final sem achados nos padrões cobertos; regras de ignore verificadas para 10 caminhos representativos. Revisados diff/whitespace e os arquivos novos. CI Linux remoto, configurações da conta GitHub e revisão jurídica da titularidade: não executados.

A preparação técnica local pode ser revisada. A licença MIT está decidida; a identificação do titular e a criação/configuração do remoto continuam pendentes. Nenhum arquivo foi adicionado ao index por esta tarefa. Após essas decisões, revisar o conjunto exato, fazer o primeiro commit alinhado e enviar somente a branch pública aprovada. Publicar o site continua sujeito ao guia de deploy, sem confundir os dois processos.

## Publicação autorizada — 2026-10-30

A pessoa responsável autorizou criar o repositório e publicar o código. Remoto público criado em [andersonmunizs/devtools-hub](https://github.com/andersonmunizs/devtools-hub), sem arquivos gerados pelo GitHub. Licença MIT finalizada em `LICENSE` usando a identidade pública da conta autenticada, `andersonmunizs`. Autoria Git local usa o endereço noreply associado ao ID público da conta; a configuração global não foi alterada.

Confirmados por API: relato privado de vulnerabilidades, secret scanning e push protection habilitados; Actions com token de leitura e sem permissão de aprovar PRs. Aplicada aprovação de workflows de todos os contribuidores externos. Alertas de vulnerabilidades habilitados, auto-merge desativado. Nenhum serviço pago ou deploy configurado.

Reexecutados 286 testes unitários com sucesso, além de formato e scanner público. A primeira execução dos unitários no sandbox falhou porque as fixtures não podiam escrever a configuração Git temporária; a execução com a permissão necessária passou sem alterar testes. O diff inicial contém quebras Markdown com espaços finais dos documentos originais, preservadas deliberadamente.

Commit inicial `8436f0a` enviado à branch `main`, confirmada como padrão e única branch pública no primeiro envio. Referências internas do Codex e arquivos ignorados ficaram locais. O GitHub reconheceu a licença MIT. A consulta de alertas abertos de Dependabot e secret scanning retornou zero; isso não comprova ausência de vulnerabilidades. MFA da conta não foi exposto pela credencial disponível e não foi alterado.

A CI Linux foi disparada: [execuções de qualidade](https://github.com/andersonmunizs/devtools-hub/actions/workflows/ci.yml). No registro desta atualização, instalação congelada, scanner, lint, formato, tipos, unitários e build passaram; instalação dos navegadores/E2E/auditoria estavam em andamento. O resultado completo deve ser conferido na execução correspondente ao commit. Os 298 E2E aprovados anteriormente foram locais e não são apresentados como resultado Linux antecipado.

Proteção planejada para `main` após este envio de documentação: exigir PR, check `verify` atualizado e resolução de conversas; bloquear force push e exclusão, inclusive para administrador. Sem exigir aprovação de uma segunda pessoa enquanto há apenas uma pessoa mantenedora. Dependabot já abriu propostas de atualização; nenhuma foi integrada automaticamente. O site continua sem implantação pública; próximo passo é definir domínio e hospedagem e executar os gates de deploy.

## Referências oficiais consultadas

- [Licença no repositório](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository)
- [Relato privado de vulnerabilidades](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately)
- [Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [Segurança de GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use)
- [Ecossistemas Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)
