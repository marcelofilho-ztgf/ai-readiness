import SearchForm from "./SearchForm.jsx";

const sevLabel = { alta: "Alta", media: "Média", baixa: "Baixa" };
const sevColor = {
  alta: { border: "var(--alta)", bg: "rgba(255,84,112,.15)", text: "var(--alta)" },
  media: { border: "var(--media)", bg: "rgba(255,179,64,.15)", text: "var(--media)" },
  baixa: { border: "var(--baixa)", bg: "rgba(106,122,144,.18)", text: "var(--baixa)" },
};

export default function ResultModal({
  data,
  loading,
  error,
  onSearch,
  onClose,
  blurbs,
  ScoreGauge,
  CategoryCard,
}) {
  function onOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={onOverlayClick}>
      <div className="modal-card glass-shell rounded-[20px] p-4 sm:rounded-[24px] sm:p-8">
        {/* TOPO: URL pesquisada + nova busca + fechar */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Resultado para
              </div>
              <div className="truncate text-sm font-medium text-white">{data.url}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="flex-shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              ✕
            </button>
          </div>
          <SearchForm onSubmit={onSearch} loading={loading} compact />
          {loading && (
            <div className="text-center text-sm text-white/70">
              <span
                className="mr-2 -mb-0.5 inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30"
                style={{ borderTopColor: "#fff", animation: "spin .7s linear infinite" }}
              />
              Analisando...
            </div>
          )}
          {!loading && error && (
            <div className="text-center text-sm" style={{ color: "var(--alta)" }}>
              {error}
            </div>
          )}
        </div>

        {/* GATE */}
        {data.gate?.blocked ? (
          <div
            className="mb-5 flex items-start gap-3.5 rounded-2xl border px-5 py-[18px]"
            style={{ borderColor: "var(--alta)", background: "rgba(255,84,112,.12)" }}
          >
            <div className="text-[22px] leading-tight">⚠</div>
            <div>
              <div className="text-base font-bold" style={{ color: "var(--alta)" }}>
                Seu site está bloqueando os crawlers de IA
              </div>
              <div className="mt-1 text-sm text-white">{data.gate.message}</div>
            </div>
          </div>
        ) : (
          <div
            className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(0,216,160,.4)", background: "rgba(0,216,160,.1)", color: "var(--ok)" }}
          >
            <span>✓</span>
            <span>Os principais crawlers de IA (GPTBot, PerplexityBot, etc.) conseguem acessar o site.</span>
          </div>
        )}

        {/* SCORE */}
        <div className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-black/20 p-4 sm:gap-7 sm:p-6">
          <ScoreGauge score={data.score} />
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold leading-tight text-white sm:text-[22px]">
              {data.grade.label}
            </h2>
            <p className="mt-1.5 max-w-[380px] text-[13px] leading-snug text-white/70 sm:mt-2 sm:text-sm sm:leading-normal">
              {blurbs[data.grade.tone]}
            </p>
          </div>
        </div>

        {/* CATEGORIAS */}
        <div className="mb-3.5 mt-8 text-[13px] font-semibold uppercase tracking-wider text-white/50">
          Score por categoria
        </div>
        <div className="grid gap-2.5">
          {data.categories.map((c) => (
            <CategoryCard key={c.key} {...c} />
          ))}
        </div>

        {/* FIXES */}
        <div className="mb-3.5 mt-8 text-[13px] font-semibold uppercase tracking-wider text-white/50">
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
                  className="flex items-start gap-3 rounded-[10px] border border-white/10 bg-black/20 px-4 py-3.5"
                  style={{ borderLeft: `3px solid ${c.border}` }}
                >
                  <span
                    className="mt-px flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style={{ background: c.bg, color: c.text }}
                  >
                    {sevLabel[f.sev]}
                  </span>
                  <div className="text-sm text-white">
                    <span className="mb-0.5 block text-xs text-white/50">{f.category}</span>
                    {f.msg}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="mt-10 text-center text-[12px] text-white/40">
          Diagnóstico estratégico de AI-Readiness (GEO/AEO). Análise técnica orientativa.
        </footer>
      </div>
    </div>
  );
}
