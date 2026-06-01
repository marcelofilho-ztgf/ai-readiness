# AI-Readiness Check

Ferramenta de diagnóstico GEO/AEO: cola a URL de um site e recebe um **AI-Readiness Score (0-100)** — o quão preparado o site está para ser entendido e citado por ChatGPT, Perplexity e Gemini.

Front em **React (Vite + Tailwind)**, backend em **Node/Express** como API.

## Como rodar

### Desenvolvimento (hot reload no front)

Dois terminais:

```bash
# terminal 1 — API
cd ai-readiness
npm install        # só na primeira vez
npm start          # Express na :3000

# terminal 2 — front React
cd ai-readiness/client
npm install        # só na primeira vez
npm run dev        # Vite na :5173 (proxy /api -> :3000)
```

Abra **http://localhost:5173**.

### Produção (tudo numa porta só)

```bash
cd ai-readiness
npm run build      # builda o React em client/dist
npm start          # Express serve o front + API na :3000
```

Abra **http://localhost:3000**.

## Componentes visuais (React Bits)

O background e os cards são componentes isolados, prontos pra trocar pelos da [React Bits](https://www.reactbits.dev):

- `client/src/components/AnimatedBackground.jsx` — slot do background animado
- `client/src/components/CategoryCard.jsx` — slot do card com microinteração

Cada um tem um comentário no topo explicando como substituir pelo componente da lib (copy-paste do `.jsx`). Tailwind já está configurado, então os exemplos da React Bits colam direto.

## O que ele mede

Mede os **pré-requisitos técnicos** de GEO/AEO — se a IA consegue ler e entender o site. Não mede se a IA já te cita (isso se mede testando perguntas direto no ChatGPT/Perplexity).

| Categoria | Peso | O que checa |
|---|---|---|
| Conteúdo extraível | 25 | O texto está no HTML cru ou só aparece via JS? IAs não executam JS. |
| Dados estruturados | 25 | JSON-LD Schema.org (Organization, FAQPage, Product…) — diz à IA quem você é. |
| Autoridade & confiança | 20 | Autoria, data/frescor, páginas Sobre/Contato, links para fontes externas (E-E-A-T). |
| Blocos de resposta | 20 | Perguntas, definições diretas "X é Y", listas, parágrafos curtos extraíveis. |
| Estrutura semântica | 10 | H1 único, hierarquia de headings, tags semânticas. |

**Gate de acesso:** se o robots.txt bloqueia crawlers de IA (GPTBot, PerplexityBot etc.) ou a página tem `noindex`, o site está fora do jogo — a nota é capada em 30 e um alerta aparece no topo, independente de quão bom seja o conteúdo.

Retorna score geral, score por categoria e os **top fixes acionáveis** ordenados por severidade.

## Deploy (opcional)

Sobe direto em Render ou Railway (Node). Build: `npm install` · Start: `node server.js`.

## Nota

A análise busca o HTML servido pelo site (sem executar JS), igual ao que a maioria dos crawlers de IA enxerga. É um diagnóstico estratégico orientativo — leve os fixes ao time de web/dev.
