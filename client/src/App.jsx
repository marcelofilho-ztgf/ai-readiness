import { useState } from "react";
import AnimatedBackground from "./components/AnimatedBackground.jsx";
import ScoreGauge from "./components/ScoreGauge.jsx";
import CategoryCard from "./components/CategoryCard.jsx";

const blurbs = {
  excelente:
    "Os fundamentos técnicos estão sólidos: a IA consegue ler e entender seu site. Próximo passo é medir citação real testando perguntas no ChatGPT/Perplexity.",
  bom: "Boa base técnica. Alguns ajustes e seu site cobre os pré-requisitos de GEO/AEO.",
  medio:
    "Há fundamentos técnicos faltando. As correções abaixo têm impacto direto em quanto a IA consegue te entender.",
  ruim: "A IA tem dificuldade de ler e entender seu site. As correções de severidade alta são prioridade.",
  critico:
    "Há barreiras técnicas sérias. Comece pelos itens de severidade alta antes de qualquer outra coisa.",
};

const sevLabel = { alta: "Alta", media: "Média", baixa: "Baixa" };
const sevColor = {
  alta: { border: "var(--alta)", bg: "rgba(255,84,112,.15)", text: "var(--alta)" },
  media: { border: "var(--media)", bg: "rgba(255,179,64,.15)", text: "var(--media)" },
  baixa: { border: "var(--baixa)", bg: "rgba(106,122,144,.18)", text: "var(--baixa)" },
};

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function analyze(e) {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/analyze?url=" + encodeURIComponent(v));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro na análise");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatedBackground />
      <div className="mx-auto max-w-[820px] px-6 pb-20 pt-14">
        <header>
          <h1 className="text-[30px] font-bold tracking-tight">
            Seu site está pronto para ser{" "}
            <span style={{ color: "var(--accent-2)" }}>citado por IA</span>?
          </h1>
          <p className="mt-2.5 max-w-[620px] text-base text-muted">
            Compradores B2B não pesquisam mais só no Google. Eles perguntam ao ChatGPT,
            Perplexity e Gemini "qual empresa contratar para X". Cole sua URL e veja se seu
            site tem os fundamentos técnicos para ser lido e entendido por IA.
          </p>
          <p className="mt-3 rounded-[10px] border border-borderc bg-panel px-3.5 py-2.5 text-[13px] text-muted">
            Mede os <b className="text-textc">pré-requisitos técnicos</b> de GEO/AEO (se a IA
            consegue ler e entender seu site) — não se a IA já te cita. Isso se mede testando
            perguntas direto no ChatGPT/Perplexity.
          </p>
        </header>

        <form
          onSubmit={analyze}
          className="mt-7 flex gap-2.5 rounded-2xl border border-borderc bg-panel p-2.5"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="text"
            placeholder="cole a URL do seu site, ex: zigpay.com.br"
            autoComplete="off"
            className="flex-1 bg-transparent px-3.5 py-3 text-base outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[9px] bg-accent px-[22px] py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Analisar
          </button>
        </form>

        <div className="mt-4 min-h-[20px] text-sm" style={{ color: error ? "var(--alta)" : "var(--muted)" }}>
          {loading && (
            <span>
              <span
                className="mr-2 inline-block h-3.5 w-3.5 -mb-0.5 rounded-full border-2 border-borderc"
                style={{ borderTopColor: "var(--accent)", animation: "spin .7s linear infinite" }}
              />
              Buscando a página e rodando o diagnóstico...
            </span>
          )}
          {!loading && error}
        </div>

        {data && (
          <div className="mt-9 animate-fade">
            {/* GATE */}
            {data.gate?.blocked ? (
              <div className="mb-5 flex items-start gap-3.5 rounded-2xl border px-5 py-[18px]"
                style={{ borderColor: "var(--alta)", background: "rgba(255,84,112,.1)" }}>
                <div className="text-[22px] leading-tight">⚠</div>
                <div>
                  <div className="text-base font-bold" style={{ color: "var(--alta)" }}>
                    Seu site está bloqueando os crawlers de IA
                  </div>
                  <div className="mt-1 text-sm">{data.gate.message}</div>
                </div>
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "rgba(0,216,160,.4)", background: "rgba(0,216,160,.08)", color: "var(--ok)" }}>
                <span>✓</span>
                <span>Os principais crawlers de IA (GPTBot, PerplexityBot, etc.) conseguem acessar o site.</span>
              </div>
            )}

            {/* SCORE CARD */}
            <div className="flex items-center gap-7 rounded-[18px] border border-borderc bg-panel p-7">
              <ScoreGauge score={data.score} />
              <div>
                <h2 className="text-[22px] font-bold">{data.grade.label}</h2>
                <div className="mt-1 break-all text-sm text-muted">{data.url}</div>
                <p className="mt-3 max-w-[380px] text-sm text-muted">{blurbs[data.grade.tone]}</p>
              </div>
            </div>

            {/* CATEGORIAS */}
            <div className="mb-3.5 mt-9 text-[13px] font-semibold uppercase tracking-wider text-muted">
              Score por categoria
            </div>
            <div className="grid gap-2.5">
              {data.categories.map((c) => (
                <CategoryCard key={c.key} {...c} />
              ))}
            </div>

            {/* FIXES */}
            <div className="mb-3.5 mt-9 text-[13px] font-semibold uppercase tracking-wider text-muted">
              O que corrigir primeiro
            </div>
            <div className="grid gap-2.5">
              {data.topFixes.length === 0 ? (
                <div className="py-3.5 text-sm" style={{ color: "var(--ok)" }}>
                  Nenhuma correção crítica encontrada. Seu site está bem preparado.
                </div>
              ) : (
                data.topFixes.map((f, i) => {
                  const c = sevColor[f.sev];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-[10px] border border-borderc bg-panel px-4 py-3.5"
                      style={{ borderLeft: `3px solid ${c.border}` }}
                    >
                      <span
                        className="mt-px flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {sevLabel[f.sev]}
                      </span>
                      <div className="text-sm">
                        <span className="mb-0.5 block text-xs text-muted">{f.category}</span>
                        {f.msg}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <footer className="mt-14 text-center text-[13px] text-muted">
          Diagnóstico estratégico de AI-Readiness (GEO/AEO). Análise técnica orientativa — leve
          os fixes ao seu time de web/dev.
        </footer>
      </div>
    </>
  );
}
