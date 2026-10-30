# 05 — Modelo de ameaças, controles e verificação de segurança

**Política:** tratar todo conteúdo digitado/colado como potencialmente sensível e hostil. O MVP é estático e **não processa dados no servidor**; isso reduz riscos, mas **não elimina** XSS, supply chain, vazamento por terceiros, ataques ao navegador e erros de transformação.

## Ativos, adversários, limites de confiança

- **Ativos:** conteúdo colado, integridade das transformações, navegador e clipboard, reputação do site, dependências, pipeline de deploy e domínio.
- **Atores:** usuário com dados malformados; atacante que induz colagem; pacote malicioso comprometido; script externo; pessoa que altera repositório/CI; extensão maliciosa instalada no navegador (fora do controle do site).
- **Fronteiras:** input não confiável → transformação → DOM/clipboard; pacote/CI → bundle → navegador; site estático → infraestrutura de hospedagem.
- **Ameaças primárias:** XSS/DOM injection, exfiltração, DoS local/consumo excessivo, ReDoS se regex for adicionado, dependências maliciosas, erro silencioso em Unicode/precisão numérica, cache/histórico do navegador contendo entradas, CSP quebrada/incompleta, ataques à publicação.

## Regras obrigatórias e testes associados

| ID | Controle | Implementação requerida | Evidência / teste |
|---|---|---|---|
| SEC01 | Processamento local | Transformar em JS no navegador; sem `fetch`/XHR/WebSocket de conteúdo | E2E: interceptar requisições de rede ao executar ferramentas; inspecionar payloads |
| SEC02 | Não persistir texto | Input/output somente em estado volátil; nunca URLs, localStorage, sessionStorage, IndexedDB/cookies | E2E: executar, recarregar, verificar ausência e storage; revisão de código |
| SEC03 | XSS | React escapando texto; `textContent` para DOM manual; sem `innerHTML`/`dangerouslySetInnerHTML`/`eval` | Testar strings com `<img onerror>`/`<script>` como **texto**, sem execução |
| SEC04 | Limites | Máximo inicial 1 MiB em UTF-8; validar antes de processar; não processar a cada tecla | E2E para excesso e múltiplas tentativas; medir responsividade |
| SEC05 | Isolamento de regex (futuro) | Regex somente Web Worker terminável + orçamento explícito; sem backtracking na UI principal | Teste de padrão patológico e encerramento; **não publicar antes** |
| SEC06 | APIs criptográficas | `crypto.randomUUID` e `crypto.subtle.digest` em HTTPS; nunca `Math.random` para UUID | Unit e E2E em HTTPS; vetores conhecidos |
| SEC07 | Dependências | Lockfile, `pnpm audit`, alertas de security advisories, revisar licenses/transitive scripts | Relatório da CI, triagem e revisão de PR |
| SEC08 | CI e deploy | Branch protection/PR review, permissões mínimas da Action, secrets fora do repo, deployments controlados | Inspeção YAML, GitHub settings e logs sem segredos |
| SEC09 | CSP | Astro 7 CSP com hashes de scripts/estilos e restrições; testar build/deploy | CSP sem `unsafe-eval`; sem violações relevantes, validar Headers |
| SEC10 | Headers | `frame-ancestors 'none'` em cabeçalho HTTP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS em HTTPS | `curl -I` em produção; teste de headers, não só config |
| SEC11 | Privacidade | Sem analytics, embeds, trackers, imagens CDN ou fontes externas no MVP | Revisar Network/Sources e bundle; página de privacidade honesta |
| SEC12 | Erros | Mostrar mensagem útil sem incluir dados do usuário em logger externo | Unit/Network; sem serviços de erro por padrão |
| SEC13 | Link externo | Se necessário: URL permitida, `rel="noopener noreferrer"` para `target=_blank` | Revisão de DOM e navegador |
| SEC14 | Entrada JSON | Nunca executar input como JS; `JSON.parse` e saída como texto; não mergear objetos não confiáveis em protótipos | Testes `__proto__`, payloads malformados, profundidade/tamanho |
| SEC15 | SEO e dados | Nunca incluir texto digitado em query params, metadata, canonicals ou links compartilháveis | Navegação, histórico, URL e DOM tests |
| SEC16 | Resposta a incidentes | Procedimento para triagem, correção, rollback e comunicação | Checklist de release e documento de manutenção |

## CSP em Astro 7 (requisito de implementação)

**Controle de expansão JSON:** conforme a [ADR-0007](adr/0007-orcamento-de-saida-json.md) aprovada, limitar a saída a 8 MiB UTF-8 durante a serialização nativa, antes de construir saída excessiva. Não truncar nem oferecer resultado parcial. Testar os dois lados da fronteira, chaves/valores Unicode e entrada pequena com grande expansão por indentação. Manter o limite de entrada de 1 MiB.

- Habilitar `security.csp` no `astro.config.mjs` conforme docs da **versão efetivamente instalada** (Astro 7). O Astro gera hashes para scripts/estilos emitidos e meta CSP. Testar **`build`/`preview`**, pois a funcionalidade difere no `dev`.
- Definir/avaliar diretivas restritas como `default-src 'self'`, `connect-src 'none'` (caso nenhuma conexão seja necessária), `img-src 'self' data:` (somente se dados inline necessários), `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`; usar fontes e imagens locais; não relaxar sem demonstrar necessidade.
- `frame-ancestors 'none'` precisa de cabeçalho **HTTP**; não funciona em `<meta http-equiv>`. No Cloudflare Pages estático, configurar em `public/_headers`; validar o resultado com request real. O _headers não serve automaticamente para Pages Functions/SSR, que estão fora do escopo.
- Se definir `Content-Security-Policy` no servidor e no meta, **ambas políticas se aplicam**. Evitar gerar políticas conflitantes que bloqueiem ilhas React; não “corrigir” incluindo `unsafe-inline`/`unsafe-eval` às cegas. Identificar o script e ajustar hash/config/estratégia.
- Considerar `upgrade-insecure-requests` se compatível; HTTPS no domínio de produção. `HSTS` apenas em domínio HTTPS controlado (revisar `includeSubDomains` antes de ativar; não aplicar preload sem decisão).

**Baseline HTTP para Cloudflare Pages (validar no deploy):**

```text
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: frame-ancestors 'none'
```

O snippet **não é a CSP completa**: script/style/font/connect devem ser definidos e auditados em Astro. Adicionar `Strict-Transport-Security` em produção depois de confirmar domínio e HTTPS; testar se as políticas cumulativas funcionam. Evitar falsa afirmação de segurança apenas por presença de headers.

## Casos de ataque/qualidade obrigatórios

1. Colar `<img src=x onerror=alert(1)>` em JSON inválido e em entradas textuais; deve aparecer como dado sem execução.
2. Inserir JSON válido com chaves `__proto__` e `constructor`; não poluir objeto global.
3. Inserir 1 MiB+ de texto, JSON com profundidade elevada e strings longas; não congelar navegador indefinidamente; limites previsíveis.
4. UTF-8 com caracteres multibyte/emoji, acentos, surrogate inválido; documentar comportamento.
5. Base64 inválido, URI percent-encoding incompleto e timestamp fora do intervalo; erro seguro e claro.
6. Revisar guia de cache: inputs não devem sobreviver ao reload pelo código do aplicativo. Atenção à restauração de formulário pelo próprio navegador e screenshots/extensões; não prometer impossibilidade total de retenção.
7. No DevTools Network, verificar que transformar/copiar não produz exfiltração; não confundir requests normais de assets do site com envio de entrada.
8. Inspecionar `dist/` para tokens/chaves, URLs externas e dependências indevidas.
9. Testar CSP no **build de produção**, em Chrome/Firefox, e headers no domínio real.
10. Auditar `pnpm-lock.yaml`, dependências críticas e advisories; ausência de alerta não significa ausência de vulnerabilidade.

## Segurança e privacidade por default

- Não coletar e-mails, IP para analytics de aplicação, textos, amostras, logs de debugging de input ou cookies próprios do MVP.
- A hospedagem/CDN pode ter **logs técnicos de acesso a arquivos**, incluindo IP e metadados de request, conforme configurações/contrato; página de privacidade deve distinguir isso de **conteúdo digitado no site**, que não será enviado pelo aplicativo.
- Não prometer "100% seguro" ou privacidade absoluta: extensões, malware, sistema operacional e ações voluntárias de cópia/compartilhamento ficam fora da garantia do aplicativo.
- Se houver telemetria, autenticação, API, upload, armazenamento, tracking, suporte ou serviços de terceiros, parar e refazer inventário de dados, threat model e análise LGPD antes de entregar.

## PR security review obrigatório

- [ ] Escopo estático/cliente preservado?
- [ ] Inputs tratados como texto não confiável?
- [ ] Nenhuma requisição com payload do usuário?
- [ ] Sem persistência involuntária?
- [ ] Sem dependência ou script externo desnecessário?
- [ ] Edge cases e tamanho testados?
- [ ] CSP gerada, headers reais verificados?
- [ ] Sem credenciais/regras de segurança enfraquecidas?
- [ ] CI/security audit executado e findings classificados?
- [ ] Riscos residuais explícitos e aceitos conscientemente?

## Padrões de referência

Usar **OWASP ASVS 5.0** como estrutura de auditoria proporcional ao escopo, OWASP DOM-based XSS Prevention/Web Frontend Security/HTML5 Security Cheat Sheets e docs oficiais dos frameworks. Não alegar "conformidade OWASP" sem auditoria formal; mapear requisitos aplicáveis e evidências reais.
