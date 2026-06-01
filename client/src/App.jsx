import { useState } from "react";
import AnimatedBackground from "./components/AnimatedBackground.jsx";
import ScoreGauge from "./components/ScoreGauge.jsx";
import CategoryCard from "./components/CategoryCard.jsx";
import SearchForm from "./components/SearchForm.jsx";
import ResultModal from "./components/ResultModal.jsx";

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

export { blurbs };

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function analyze(rawUrl) {
    const v = (rawUrl || "").trim();
    if (!v) return;
    setLoading(true);
    setError("");
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

      <div className="flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-12">
        {/* CARD EXTERNO envolvendo todo o conteúdo — centrado na tela */}
        <div className="glass-shell flex w-full max-w-[780px] flex-col items-center rounded-[24px] px-5 py-8 sm:rounded-[28px] sm:px-12 sm:py-12">
          <header className="flex flex-col items-center text-center">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[32px] sm:leading-tight">
              Seu site está pronto para ser{" "}
              <span style={{ color: "var(--accent-2)" }}>citado por IA</span>?
            </h1>
            <p className="mx-auto mt-2.5 max-w-[620px] text-[13px] leading-snug text-muted sm:mt-3 sm:text-base sm:leading-normal">
              Compradores B2B não pesquisam mais só no Google. Eles perguntam ao ChatGPT,
              Perplexity e Gemini "qual empresa contratar para X". Cole sua URL e veja se seu
              site tem os fundamentos técnicos para ser lido e entendido por IA.
            </p>
            <p className="glass-soft mx-auto mt-3 max-w-[560px] rounded-xl px-3.5 py-2 text-[12px] leading-snug text-muted sm:mt-5 sm:px-4 sm:py-2.5 sm:text-[13px]">
              Mede os <b className="font-bold text-textc">pré-requisitos técnicos</b> de GEO/AEO
              (se a IA consegue ler e entender seu site) — não se a IA já te cita. Isso se mede
              testando perguntas direto no ChatGPT/Perplexity.
            </p>
          </header>

          <SearchForm onSubmit={analyze} loading={loading} className="mt-5 w-full sm:mt-8" />

          <div
            className="mt-4 min-h-[20px] w-full text-center text-sm"
            style={{ color: error ? "var(--alta)" : "rgba(255,255,255,.7)" }}
          >
            {loading && (
              <span>
                <span
                  className="mr-2 -mb-0.5 inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30"
                  style={{ borderTopColor: "#fff", animation: "spin .7s linear infinite" }}
                />
                Buscando a página e rodando o diagnóstico...
              </span>
            )}
            {!loading && error}
          </div>
        </div>
      </div>

      {/* MODAL DE RESULTADO */}
      {data && (
        <ResultModal
          data={data}
          loading={loading}
          error={error}
          onSearch={analyze}
          onClose={() => {
            setData(null);
            setError("");
          }}
          blurbs={blurbs}
          ScoreGauge={ScoreGauge}
          CategoryCard={CategoryCard}
        />
      )}
    </>
  );
}
