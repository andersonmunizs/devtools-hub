# DevTools Hub

Utilitários para desenvolvedores em português, com processamento local no navegador. Astro gera páginas estáticas; React hidrata os controles interativos.

**Estado:** [código público no GitHub](https://github.com/andersonmunizs/devtools-hub), com seis ferramentas funcionais; publicação no GitHub Pages em preparação. Veja as [verificações de CI](https://github.com/andersonmunizs/devtools-hub/actions/workflows/ci.yml), o [registro do repositório](docs/21-REPOSITORIO-PUBLICO.md) e a [prontidão do site](docs/18-PRE-RELEASE.md).

Destino do site: [DevTools Hub](https://andersonmunizs.github.io/devtools-hub/). Veja o [procedimento de publicação e limitações](docs/22-GITHUB-PAGES.md).

## Ferramentas

| Ferramenta | Uso |
| --- | --- |
| JSON | Validar, formatar e minificar |
| Base64 ↔ UTF-8 | Codificar/decodificar texto com Unicode |
| Componente URL | Codificar/decodificar uma camada de um componente |
| Tempo Unix | Converter segundos/milissegundos para UTC e fuso do navegador |
| UUID v4 | Gerar 1–20 identificadores com Web Crypto |
| SHA-256 | Calcular hash hexadecimal de texto UTF-8 |

Catálogo com ícones, busca por tarefa e filtros. Exemplos são sintéticos; as ferramentas têm limpar, copiar com feedback e alternativa manual.

## Executar

Use Node **24.22.2** e pnpm **11.25.0**, conforme `.node-version` e `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra o endereço informado pelo Astro com o caminho `/devtools-hub/`. Para verificar o artefato estático, execute `pnpm build` e `pnpm preview`. Nenhum `.env`, token ou conta externa é necessário. UUID/SHA-256 exigem Web Crypto e contexto seguro, como HTTPS ou localhost confiável.

## Privacidade e limites

Entrada e saída ficam em memória: o aplicativo não envia conteúdo para processamento remoto, não o inclui na URL e não o salva em storage/cookies. Somente a escolha de tema é persistida. Copiar exige ação explícita e usa o clipboard do dispositivo, cuja retenção/sincronização depende do sistema. Extensões, malware e restauração de formulários pelo navegador ficam fora dessa garantia. A hospedagem pode registrar acessos técnicos a arquivos.

Entrada de texto: até **1 MiB UTF-8** por ação. JSON limita a saída a **8 MiB**, pela [ADR-0007](docs/adr/0007-orcamento-de-saida-json.md), e segue a precisão numérica JavaScript. Base64 rejeita bytes UTF-8 inválidos; Base64/URL podem gerar saída maior que uma nova entrada. Timestamp não infere unidade. Hash não cifra texto nem substitui armazenamento apropriado de senhas. As páginas explicam as demais regras.

## Verificar

```sh
pnpm check:public
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium firefox
pnpm test:e2e
pnpm audit --audit-level high
```

Os E2E iniciam o preview na porta 4321; encerre outra prévia nessa porta antes da suíte. A CI usa lockfile congelado e permissões de leitura. Instalação e testes de PRs executam código não confiável: use ambiente descartável sem credenciais. A verificação pública usa padrões limitados e não substitui revisão humana ou secret scanning do GitHub.

## Contribuições e segurança

- [CONTRIBUTING.md](CONTRIBUTING.md): ambiente, critérios e revisão de PRs.
- [SECURITY.md](SECURITY.md): relato de vulnerabilidades. Não envie segredos ou detalhes exploráveis em issues públicas.
- [AGENTS.md](AGENTS.md): contrato técnico do projeto.
- [PRD](docs/02-PRD-MVP.md), [UI/UX](docs/03-UI-UX.md) e [arquitetura](docs/04-ARQUITETURA-E-STACK.md).
- [Deploy, rollback e incidentes](docs/19-DEPLOY-ROLLBACK-E-INCIDENTES.md): procedimento preparado, ainda não executado.

Sem backend, auth, banco ou analytics. Dependências novas e mudanças de stack/risco exigem justificativa e decisão documentada. Astro 7 foi aprovado pela [ADR-0006](docs/adr/0006-atualizacao-de-seguranca-do-astro.md).

## Licença

Código sob a [licença MIT](LICENSE), identificado pelo perfil público `andersonmunizs`. Dependências mantêm suas próprias licenças; veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
