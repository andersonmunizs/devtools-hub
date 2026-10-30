# Contribuir

Antes de mudanças maiores, discuta o problema em uma issue com dados sintéticos. Para vulnerabilidades, siga `SECURITY.md`. Trate outras pessoas com respeito, discuta ideias e evite divulgar dados privados em issues, PRs, screenshots ou logs.

## Ambiente e verificações

Use Node 24.22.2 e pnpm 11.25.0, conforme `.node-version` e `package.json`.

```sh
pnpm install --frozen-lockfile
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

Os E2E iniciam um preview isolado na porta 4321. Encerre uma prévia local nessa porta antes de rodar a suíte. Dois casos de leitura nativa de clipboard são ignorados em Firefox por limitações do runner; os demais cenários de cópia permanecem obrigatórios.

## Regras do projeto

- Leia `AGENTS.md` e a documentação relevante. Mantenha mudanças pequenas, com problema, aceite e evidência de validação.
- Não envie entrada/saída das ferramentas a serviços nem a persista. Use fixtures sintéticas; nunca cole credenciais ou logs reais em testes.
- Preserve acessibilidade, foco, mobile, limites UTF-8 e comportamento explícito de Unicode/unidades. Teste sucesso, erro e bordas de funcionalidades.
- Novas dependências, tecnologia, backend ou mudanças de risco exigem justificativa e decisão documentada antes de implementação.
- Execute ferramentas de PRs não confiáveis em ambiente descartável e sem credenciais. Instalação/build/testes executam código do checkout.
- Na descrição do PR, explique problema, mudança, verificações executadas e limitações. Não alegue testes não realizados.

O proprietário revisa e decide a integração. Não há garantia de prazo de revisão. Consulte a [licença MIT](LICENSE) antes de distribuir contribuições.
