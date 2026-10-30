# 03 — UX, UI, acessibilidade e diretrizes anti-AI-Slop

## Objetivo de experiência

Fazer o desenvolvedor localizar uma função em segundos, entender exatamente o que será transformado e copiar um resultado correto sem distrações. **Utilidade primeiro; estética é consequência de hierarquia e consistência, não de efeitos.**

## Pilares

1. **Precisão:** nomenclatura técnica exata (JSON, Base64 UTF-8, componente de URL, Unix seconds/ms).
2. **Foco:** uma tarefa primária por tela; entrada e resultado dominam a composição.
3. **Confiança:** privacidade verificável, explicação de limites, nenhum resultado fabricado.
4. **Controle:** nunca transformar conteúdo silenciosamente; botão "Processar" e feedback claro.
5. **Acessibilidade:** navegação e operação completas por teclado/leitor de tela.

## Direção visual original

**Estilo:** utilitário editorial, limpo, técnico, discreto e funcional; não copiar diretamente layouts de produtos populares. Sem dashboard corporativo artificial nem estética de landing page de IA.

- Paleta clara: fundo `#F6F8FA`, superfície `#FFFFFF`, texto principal `#162331`, secundário `#526172`, borda `#D8E0E7`, destaque `#0F766E`, erro `#B42318`.
- Paleta escura: fundo `#0C141C`, superfície `#14202B`, texto `#EFF5F8`, secundário `#B5C3CC`, borda `#344651`, destaque `#5EEAD4`, erro `#FDA29B`.
- **São propostas de tokens, não garantia de contraste:** testar todas as combinações no navegador; ajustar para WCAG 2.2 AA se necessário. Estados `hover`, `active`, `focus-visible`, `disabled` e erro têm tokens próprios.
- Tipografia: `system-ui` para interface; fonte mono local/sistema para entrada/saída (`ui-monospace`, `SFMono-Regular`, `Consolas`, monospace). Não carregar fontes por CDN.
- Escala de espaçamento em múltiplos de 4; 8/12/16/24/32/48; raio 8–12 px (não usar pilhas excessivas de cantos arredondados).
- Container de conteúdo até aproximadamente `1200px`; linha de texto explicativo com largura confortável (~65–75 caracteres).
- Transições curtas e funcionais; desativar/reduzir com `prefers-reduced-motion`.

## Estrutura de páginas

**Refinamento de descoberta (2026-10-30):** catálogo com ícone específico e ações visíveis por ferramenta, duas colunas desktop/uma mobile; busca combinando termos sem distinguir acentos; filtros de categoria com estado acessível e recuperação por limpar. Hero compacto, com prioridade para a busca. Cores dos ícones apenas reforçam rótulos e não substituem identificação textual. Motivos e evidências em `docs/20-UI-DESCOBERTA.md`.

### Catálogo `/`

- Cabeçalho: marca discreta, link para ferramentas, alternância de tema e link "Privacidade".
- Título que explica serviço sem superlativos: **"Ferramentas rápidas para dados e debugging"**.
- Subtítulo: **"Formate, converta e valide dados diretamente no navegador."**
- Busca por nome/termos; resultado e estado de "nenhuma ferramenta encontrada".
- Lista clara agrupada por uso, com título, uma linha de descrição e link; não inflar o catálogo com ferramentas indisponíveis.
- Bloco de confiança: três fatos verificáveis (sem conta; dados processados no navegador; sem retenção automática de entradas).
- Rodapé: privacidade, documentação e versão do projeto (se informativa).

### Página `/ferramentas/[slug]`

```
[Home > Ferramentas > JSON]                [Tema]

Validador e formatador JSON
Valide e organize JSON sem enviar conteúdo a um servidor.

[Entrada]               [Resultado]         (desktop)
[área de texto]         [área de texto]
[Exemplo] [Limpar]      [Copiar]
       [Formatar] [Minificar]

[Erro específico OU confirmação discreta]
[O que faz] [Limites] [Uso seguro]
```

- Desktop: dois painéis de proporção equilibrada. Mobile: painéis empilhados, ação entre entrada e resultado, sem forçar scroll horizontal na página; rolagem horizontal **dentro** da área monoespaçada quando necessário.
- Resultados de erro devem ser visíveis junto do campo, em texto, não só cor; preservar o texto digitado.
- Não renderizar conteúdo introduzido como HTML/Markdown executável.
- Área com exemplo seguro sintético, sinalizado como exemplo e nunca sobrepondo input sem consentimento.
- `Copiar` desabilitado se não houver resultado; retorno "Copiado" em região `aria-live="polite"`, além de fallback quando a Clipboard API falhar.
- Incluir links contextuais apenas para ferramentas úteis relacionadas, sem "recomendados" fictícios.

## Componentes base

- `SiteHeader`, `SiteFooter`, `ToolCard` (link inteiro sem nested interactive), `SearchTools`, `ToolPageLayout` (Astro), `ToolInput`, `ToolOutput`, `ToolActions`, `InlineFeedback`, `ThemeToggle` (React somente onde necessário), `PrivacyNotice`.
- `ToolInput` e `ToolOutput` devem ter labels, aria-describedby, estado de erro, seleções/cópia e max size.
- Se usar dialog/menu/listbox, adotar comportamento de teclado WAI-ARIA Authoring Practices; só adicionar Radix quando componentes nativos não atenderem.
- Não colocar o texto de erros dentro de tooltips ou toast transitório exclusivo.

## Qualidade de microcopy

- Em vez de "Oops! Algo deu errado!", dizer "JSON inválido: caractere inesperado na posição 18" (quando a posição for verificável).
- Em vez de "Gerar magia", dizer "Gerar UUID".
- Em vez de "Seu código está seguro!", dizer "O texto é processado neste navegador; não é enviado pelo site para processamento remoto" (afirmação só se comprovada em rede).
- Usar frases curtas, sem termos de marketing vagos. A interface inteira em pt-BR, com termos técnicos padronizados.

## Checklist anti-AI-Slop (obrigatório em review)

- [ ] Nenhum dado de dashboard, contagem de usuários, review ou depoimento inventado.
- [ ] Sem cards decorativos apenas para preencher espaços.
- [ ] Sem gradientes vibrantes/glows massivos, emojis aleatórios e ícones sem função.
- [ ] Sem lorem ipsum ou botões de CTA sem destino/ação real.
- [ ] Identidade visual consistente entre catálogo e páginas de ferramenta.
- [ ] Regras de tipografia, cores, espaçamentos e estados documentadas e aplicadas.
- [ ] Erros úteis, vazios intencionais, carregamento transparente (se existir) e sucesso discreto.
- [ ] Visual verificado em 320, 375, 768, 1024 e 1440 px.
- [ ] Teclado e leitor de tela não dependem de atalhos escondidos.
- [ ] Diferença real de qualidade percebida: rapidez, clareza e resultado correto, não efeitos.

## Acessibilidade e UX mensurável

- WCAG 2.2 **AA** como meta: contraste texto 4,5:1 (texto grande 3:1), controles com contraste perceptível; testar estados reais.
- Foco visível, ordem de tabulação lógica, tamanho alvo confortável idealmente 44x44, mínimo WCAG aplicável; não usar placeholder como único label.
- Títulos ordenados e um `h1` por página; atalhos não colidem com navegador ou leitor de tela.
- Alertas e resultados possuem anúncio apropriado; não fazer anúncio excessivo em cada tecla digitada.
- Testar com teclado sem mouse e, quando possível, NVDA+Chrome e VoiceOver+Safari (anotar execução/limites).
- Respeitar ampliação a 200% e 400%, zoom e preferências de movimento/tema.

## Critério de aprovação de UI

Review com screenshots reais **desktop e mobile** do build rodando, auditoria de acessibilidade, fluxos completos com mouse e teclado, inexistência de console errors, contraste verificado e uma rodada de teste moderado de tarefa com usuário. Screenshot de mockup não equivale a fluxo funcionando.
