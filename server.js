const express = require("express");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve o build do React (client/dist) em produção, se existir.
const clientDist = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "PerplexityBot", "Google-Extended", "ClaudeBot", "Claude-Web", "Amazonbot"];

function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    ...opts,
    signal: ctrl.signal,
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AI-Readiness-Check/1.0; +https://example.com/bot)",
      "Accept": "text/html,application/xhtml+xml",
      ...(opts.headers || {}),
    },
  }).finally(() => clearTimeout(t));
}

function normalizeUrl(input) {
  let u = String(input || "").trim();
  if (!u) throw new Error("URL vazia");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Protocolo inválido");
  return parsed;
}

// Coleta os tipos de Schema.org uma vez, reaproveitado por várias checagens
function collectSchemaTypes($) {
  const types = new Set();
  const nodes = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).contents().text();
      const data = JSON.parse(raw);
      const arr = Array.isArray(data) ? data : (data["@graph"] ? data["@graph"] : [data]);
      arr.forEach((node) => {
        if (!node) return;
        nodes.push(node);
        const t = node["@type"];
        if (Array.isArray(t)) t.forEach((x) => types.add(x));
        else if (t) types.add(t);
      });
    } catch (_) {}
  });
  return { types, nodes };
}

// ---------- Checagens ----------

// 1. Conteúdo extraível (25)
function checkExtractable($) {
  const findings = [];
  let score = 0;

  const bodyClone = $("body").clone();
  bodyClone.find("script, style, noscript, svg").remove();
  const text = bodyClone.text().replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;

  if (wordCount >= 500) { score += 15; }
  else if (wordCount >= 200) { score += 9; findings.push({ ok: false, sev: "media", msg: `Pouco texto extraível (${wordCount} palavras). IAs precisam de conteúdo em texto para entender e citar a página.` }); }
  else { findings.push({ ok: false, sev: "alta", msg: `Quase nenhum texto extraível no HTML (${wordCount} palavras). Provavelmente o conteúdo só aparece via JavaScript — a maioria das IAs não executa JS e vê uma página vazia.` }); }

  const scriptBytes = $("script").toArray().reduce((s, el) => s + ($(el).html() || "").length, 0);
  const ratio = text.length > 0 ? scriptBytes / text.length : Infinity;

  if (wordCount < 200 && scriptBytes > 5000) {
    findings.push({ ok: false, sev: "alta", msg: "Página parece ser renderizada quase 100% por JavaScript (SPA). Considere SSR/SSG ou pré-renderização para que o conteúdo apareça no HTML inicial." });
  } else if (ratio < 50) {
    score += 10;
  } else if (ratio < 200) {
    score += 6;
    findings.push({ ok: false, sev: "baixa", msg: "Boa parte da página é JavaScript em relação ao texto visível. Vale checar se o conteúdo principal está no HTML servido." });
  } else {
    findings.push({ ok: false, sev: "media", msg: "Alta proporção de JavaScript em relação a texto. Risco de a IA não enxergar o conteúdo principal." });
  }

  if (score >= 24) findings.unshift({ ok: true, sev: "ok", msg: `Conteúdo bem extraível (${wordCount} palavras em texto puro).` });
  return { score: Math.min(score, 25), max: 25, findings };
}

// 2. Dados estruturados (25)
function checkStructuredData($, schemaTypes) {
  const findings = [];
  let score = 0;
  const types = schemaTypes;
  const hasMicrodata = $("[itemscope]").length > 0;

  if (types.size === 0 && !hasMicrodata) {
    findings.push({ ok: false, sev: "alta", msg: "Nenhum dado estruturado (Schema.org / JSON-LD) encontrado. Isto é o que mais ajuda uma IA a entender 'quem é a empresa e o que ela faz'. É a correção de maior impacto." });
    return { score: 0, max: 25, findings };
  }

  if (types.size > 0) score += 8;
  if (hasMicrodata && types.size === 0) { score += 4; findings.push({ ok: false, sev: "media", msg: "Há microdata, mas não JSON-LD. JSON-LD é o formato preferido pelos motores de IA — migre para ele." }); }

  const found = [];
  const orgFound = ["Organization", "LocalBusiness", "Corporation"].some((t) => types.has(t));
  if (orgFound) { score += 9; found.push("Organization/LocalBusiness (identidade da empresa)"); }
  if (types.has("FAQPage")) { score += 5; found.push("FAQPage (respostas diretas)"); }
  if (["Product", "Service", "Article", "BlogPosting"].some((t) => types.has(t))) {
    score += 3;
    ["Product", "Service", "Article", "BlogPosting"].forEach((t) => { if (types.has(t)) found.push(t); });
  }

  if (found.length) findings.unshift({ ok: true, sev: "ok", msg: `Dados estruturados detectados: ${[...new Set(found)].join(", ")}.` });
  if (!orgFound)
    findings.push({ ok: false, sev: "alta", msg: "Falta schema de Organization/LocalBusiness. Sem ele, a IA não tem fonte estruturada do nome, descrição e área de atuação da empresa." });
  if (!types.has("FAQPage"))
    findings.push({ ok: false, sev: "media", msg: "Sem FAQPage estruturado. FAQs em Schema são extraídas diretamente por IAs como resposta a perguntas dos usuários." });

  return { score: Math.min(score, 25), max: 25, findings };
}

// 3. Autoridade & confiança (20) — NOVO. E-E-A-T on-page: autoria, frescor, sobre/contato, fontes
function checkAuthority($, schema) {
  const findings = [];
  let score = 0;
  const { types, nodes } = schema;
  const bodyText = $("body").text();
  const lowerText = bodyText.toLowerCase();
  const html = $.html().toLowerCase();

  // --- Autoria ---
  const hasAuthorSchema = nodes.some((n) => n && (n.author || (n["@type"] && /Article|BlogPosting/.test(JSON.stringify(n["@type"])) && n.author)));
  const hasAuthorMeta = $('meta[name="author"]').attr("content") || $('[rel="author"]').length || $('[itemprop="author"]').length;
  const mentionsAuthor = /\b(por|autor|escrito por|written by|by)\b/i.test($("article, main").text() || "");
  if (hasAuthorSchema || hasAuthorMeta) { score += 5; }
  else if (mentionsAuthor) { score += 2; findings.push({ ok: false, sev: "baixa", msg: "Autoria aparece no texto mas não em dado estruturado. Marcar author no schema reforça a confiança (E-E-A-T) que a IA usa para escolher quem citar." }); }
  else { findings.push({ ok: false, sev: "media", msg: "Sem sinal de autoria (author no schema, meta author ou byline). IAs favorecem conteúdo com autor identificável ao decidir o que citar." }); }

  // --- Frescor / data ---
  const hasDateSchema = nodes.some((n) => n && (n.datePublished || n.dateModified));
  const hasTimeTag = $("time[datetime]").length > 0;
  const dateInText = /\b(20\d{2})\b/.test(bodyText) && /(atualizado|publicado|updated|published|janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(lowerText);
  if (hasDateSchema || hasTimeTag) { score += 5; }
  else if (dateInText) { score += 2; findings.push({ ok: false, sev: "baixa", msg: "Data aparece no texto mas não estruturada (datePublished/dateModified ou tag <time>). Frescor é critério de citação — deixe explícito e estruturado." }); }
  else { findings.push({ ok: false, sev: "media", msg: "Sem indicação de data/frescor. IAs priorizam conteúdo recente e datado; adicione datePublished/dateModified." }); }

  // --- Páginas de confiança (sobre / contato) ---
  const links = $("a[href]").toArray().map((a) => (($(a).attr("href") || "") + " " + $(a).text()).toLowerCase());
  const hasAbout = links.some((l) => /(sobre|about|quem-somos|quem somos|institucional)/.test(l));
  const hasContact = links.some((l) => /(contato|contact|fale-conosco|fale conosco)/.test(l));
  if (hasAbout && hasContact) { score += 5; }
  else if (hasAbout || hasContact) { score += 3; findings.push({ ok: false, sev: "baixa", msg: "Falta página de 'Sobre' ou 'Contato' acessível. Esses sinais institucionais ajudam a IA a confiar na origem da informação." }); }
  else { findings.push({ ok: false, sev: "media", msg: "Sem links claros para 'Sobre' e 'Contato'. Sinais institucionais básicos aumentam a confiança que a IA atribui ao site." }); }

  // --- Citações / fontes externas ---
  let host = "";
  try { host = new URL($('link[rel="canonical"]').attr("href") || "http://x").host; } catch (_) {}
  const externalLinks = $("a[href^='http']").toArray().filter((a) => {
    try { const h = new URL($(a).attr("href")).host; return host ? h !== host : true; } catch (_) { return false; }
  }).length;
  if (externalLinks >= 3) { score += 5; findings.unshift({ ok: true, sev: "ok", msg: "Bons sinais de autoridade (autoria, data e/ou links para fontes externas)." }); }
  else if (externalLinks >= 1) { score += 2; }
  else { findings.push({ ok: false, sev: "baixa", msg: "Poucos ou nenhum link para fontes externas. Conteúdo que referencia fontes tende a ser visto como mais confiável." }); }

  return { score: Math.min(score, 20), max: 20, findings };
}

// 4. Blocos de resposta direta (20) — peso aumentado, detecção melhor
function checkAnswerBlocks($) {
  const findings = [];
  let score = 0;
  const bodyText = $("body").text();

  // Perguntas em headings
  const questionHeadings = $("h2, h3, h4").toArray().filter((el) => /\?/.test($(el).text())).length;
  if (questionHeadings >= 2) { score += 7; findings.unshift({ ok: true, sev: "ok", msg: `${questionHeadings} seções em formato de pergunta — ótimo para a IA casar com perguntas dos usuários.` }); }
  else if (questionHeadings === 1) { score += 4; }
  else {
    const questionMarks = (bodyText.match(/\?/g) || []).length;
    if (questionMarks >= 3) score += 2;
    findings.push({ ok: false, sev: "media", msg: "Pouco conteúdo em formato de pergunta-e-resposta. IAs respondem perguntas; páginas que já estruturam perguntas e respostas são citadas com mais frequência." });
  }

  // Definições diretas "X é/são Y"
  const paras = $("p").toArray().map((el) => $(el).text().trim()).filter((t) => t.length > 0);
  const definitions = paras.filter((p) => /^[A-ZÀ-Ú][^.?!]{2,60}\s+(é|são|significa|consiste|refere-se)\b/.test(p)).length;
  if (definitions >= 2) { score += 5; }
  else if (definitions === 1) { score += 3; }
  else { findings.push({ ok: false, sev: "baixa", msg: "Poucas definições diretas (frases tipo 'X é Y'). IAs extraem esse formato como resposta objetiva." }); }

  // Listas
  const lists = $("ul, ol").length;
  if (lists >= 3) score += 4;
  else if (lists >= 1) score += 2;
  else findings.push({ ok: false, sev: "baixa", msg: "Sem listas. Listas e passos numerados são fáceis de extrair como resposta." });

  // Parágrafos curtos e objetivos
  if (paras.length) {
    const avgLen = paras.reduce((s, p) => s + p.length, 0) / paras.length;
    if (avgLen > 0 && avgLen < 600) { score += 4; }
    else { score += 1; findings.push({ ok: false, sev: "baixa", msg: "Parágrafos longos. Blocos curtos e diretos (definições, respostas objetivas) são mais extraíveis." }); }
  } else {
    findings.push({ ok: false, sev: "media", msg: "Nenhum parágrafo de texto detectado." });
  }

  return { score: Math.min(score, 20), max: 20, findings };
}

// 5. Estrutura semântica (10)
function checkSemantics($) {
  const findings = [];
  let score = 0;
  const h1 = $("h1");
  const h2 = $("h2");
  const h3 = $("h3");

  if (h1.length === 1) { score += 4; }
  else if (h1.length === 0) { findings.push({ ok: false, sev: "alta", msg: "Página sem H1. O H1 diz à IA qual é o assunto principal da página." }); }
  else { score += 1; findings.push({ ok: false, sev: "media", msg: `Múltiplos H1 (${h1.length}). Use só um H1 por página para deixar o tema principal inequívoco.` }); }

  if (h2.length >= 2) { score += 3; }
  else if (h2.length === 1) { score += 1; findings.push({ ok: false, sev: "baixa", msg: "Poucos H2. Subtítulos ajudam a IA a mapear os subtópicos da página." }); }
  else { findings.push({ ok: false, sev: "media", msg: "Sem H2. Quebre o conteúdo em seções com subtítulos claros." }); }

  if (h3.length >= 1) score += 1;

  const semanticTags = ["main", "article", "section", "nav", "header", "footer"].filter((t) => $(t).length > 0);
  if (semanticTags.length >= 4) { score += 2; findings.unshift({ ok: true, sev: "ok", msg: `Boa estrutura semântica (${semanticTags.join(", ")}).` }); }
  else if (semanticTags.length >= 2) { score += 1; }
  else { findings.push({ ok: false, sev: "baixa", msg: "Pouca marcação semântica (main, article, section). Ajuda a IA a separar conteúdo de navegação." }); }

  return { score: Math.min(score, 10), max: 10, findings };
}

// 6. Acesso dos bots de IA — GATE (não soma; vira alerta + penalidade)
async function checkBotGate($, parsedUrl) {
  const findings = [];
  let blocked = [];
  let robotsFound = false;
  let noindex = false;

  const metaRobots = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  if (metaRobots.includes("noindex")) {
    noindex = true;
    findings.push({ ok: false, sev: "alta", msg: "A página tem meta robots 'noindex' — ela pede explicitamente para NÃO ser indexada. Isso bloqueia descoberta por buscadores e IAs." });
  }

  try {
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
    const res = await fetchWithTimeout(robotsUrl, {}, 8000);
    if (res.ok) {
      robotsFound = true;
      const robots = (await res.text()).toLowerCase();
      blocked = AI_BOTS.filter((bot) => {
        const re = new RegExp(`user-agent:\\s*${bot.toLowerCase()}[\\s\\S]*?disallow:\\s*/\\s*(\\n|$)`, "i");
        return re.test(robots);
      });
      if (blocked.length === 0) {
        findings.unshift({ ok: true, sev: "ok", msg: "robots.txt encontrado e não bloqueia os principais bots de IA (GPTBot, PerplexityBot, etc.)." });
      } else {
        findings.push({ ok: false, sev: "alta", msg: `robots.txt bloqueia bots de IA: ${blocked.join(", ")}. Esses crawlers alimentam ChatGPT, Perplexity e Gemini — bloqueá-los impede que o site seja citado.` });
      }
    } else {
      findings.push({ ok: false, sev: "baixa", msg: "Sem robots.txt acessível (não é problema grave; significa que nada está explicitamente bloqueado)." });
    }
  } catch (_) {
    findings.push({ ok: false, sev: "baixa", msg: "Não foi possível ler o robots.txt." });
  }

  const isBlocked = blocked.length > 0 || noindex;
  return { isBlocked, blocked, noindex, robotsFound, findings };
}

function grade(score, gated) {
  if (gated) return { label: "Bloqueado para IA", tone: "critico" };
  if (score >= 85) return { label: "Bem preparado para IA", tone: "excelente" };
  if (score >= 70) return { label: "Quase lá", tone: "bom" };
  if (score >= 50) return { label: "Fundamentos incompletos", tone: "medio" };
  if (score >= 30) return { label: "Pouco legível para IA", tone: "ruim" };
  return { label: "Quase ilegível para IA", tone: "critico" };
}

app.get("/api/analyze", async (req, res) => {
  let parsed;
  try {
    parsed = normalizeUrl(req.query.url);
  } catch (e) {
    return res.status(400).json({ error: "URL inválida. Exemplo: zigpay.com.br" });
  }

  let html;
  try {
    const r = await fetchWithTimeout(parsed.toString());
    if (!r.ok) return res.status(502).json({ error: `O site respondeu com status ${r.status}. Verifique a URL.` });
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("html")) return res.status(415).json({ error: "A URL não retornou HTML." });
    html = await r.text();
  } catch (e) {
    return res.status(502).json({ error: "Não consegui acessar o site (timeout ou bloqueio anti-bot). Tente outra URL." });
  }

  const $ = cheerio.load(html);
  const schema = collectSchemaTypes($);

  const categories = [
    { key: "extractable", name: "Conteúdo extraível", desc: "A IA consegue ler o texto no HTML?", ...checkExtractable($) },
    { key: "structured", name: "Dados estruturados", desc: "Schema.org diz à IA quem você é.", ...checkStructuredData($, schema.types) },
    { key: "authority", name: "Autoridade & confiança", desc: "Sinais que fazem a IA confiar e citar.", ...checkAuthority($, schema) },
    { key: "answers", name: "Blocos de resposta", desc: "Conteúdo fácil de citar como resposta.", ...checkAnswerBlocks($) },
    { key: "semantics", name: "Estrutura semântica", desc: "Títulos e hierarquia claros.", ...checkSemantics($) },
  ];

  const gate = await checkBotGate($, parsed);

  const total = categories.reduce((s, c) => s + c.score, 0);
  const maxTotal = categories.reduce((s, c) => s + c.max, 0); // 95
  let score = Math.round((total / maxTotal) * 100);

  // GATE: se bloqueado, o site está fora do jogo independente do resto.
  // Aplica teto duro de 30 e marca como gated.
  if (gate.isBlocked) score = Math.min(score, 30);

  const sevRank = { alta: 0, media: 1, baixa: 2 };
  const fixes = [];
  // Findings do gate entram primeiro se forem bloqueios
  gate.findings.filter((f) => !f.ok && f.sev === "alta").forEach((f) => fixes.push({ category: "Acesso dos bots de IA", sev: f.sev, msg: f.msg }));
  categories.forEach((c) => {
    c.findings.filter((f) => !f.ok).forEach((f) => fixes.push({ category: c.name, sev: f.sev, msg: f.msg }));
  });
  gate.findings.filter((f) => !f.ok && f.sev !== "alta").forEach((f) => fixes.push({ category: "Acesso dos bots de IA", sev: f.sev, msg: f.msg }));
  fixes.sort((a, b) => sevRank[a.sev] - sevRank[b.sev]);

  res.json({
    url: parsed.toString(),
    score,
    grade: grade(score, gate.isBlocked),
    gate: {
      blocked: gate.isBlocked,
      blockedBots: gate.blocked,
      noindex: gate.noindex,
      ok: !gate.isBlocked,
      message: gate.isBlocked
        ? (gate.noindex
            ? "Esta página pede 'noindex' — ela está se excluindo de buscadores e IAs por configuração."
            : `Seu robots.txt bloqueia crawlers de IA (${gate.blocked.join(", ")}). Enquanto isso estiver assim, melhorar o conteúdo não adianta: a IA não consegue entrar.`)
        : "Os principais crawlers de IA conseguem acessar o site.",
    },
    categories: categories.map((c) => ({
      key: c.key, name: c.name, desc: c.desc,
      score: c.score, max: c.max,
      pct: Math.round((c.score / c.max) * 100),
      findings: c.findings,
    })),
    topFixes: fixes.slice(0, 6),
    analyzedAt: new Date().toISOString(),
  });
});

// Fallback SPA: qualquer rota não-API devolve o index do React (se buildado).
if (fs.existsSync(clientDist)) {
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => console.log(`AI-Readiness rodando em http://localhost:${PORT}`));
