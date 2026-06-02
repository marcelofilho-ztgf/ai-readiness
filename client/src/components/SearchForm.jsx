import { useState } from "react";

// Formulário de busca reutilizável (home e modal).
// Vazio/sem foco: liquid glass. Ao focar/digitar: fica branco.
// Botão sempre na cor accent-2 (verde "citado por IA").
export default function SearchForm({ onSubmit, loading, className = "", compact = false, initialValue = "" }) {
  const [url, setUrl] = useState(initialValue);
  const [focused, setFocused] = useState(false);

  function handle(e) {
    e.preventDefault();
    onSubmit(url);
  }

  const active = focused || url.length > 0;

  return (
    <form
      onSubmit={handle}
      className={`mx-auto flex w-full max-w-[680px] items-center gap-2 rounded-2xl p-2 transition-colors ${active ? "input-white" : "glass"} ${className}`}
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        type="text"
        placeholder="cole a URL do seu site, ex: zig.com.br"
        autoComplete="off"
        className={`min-w-0 flex-1 rounded-xl bg-transparent px-3.5 outline-none ${active ? "text-[#14101f] placeholder:text-[#6a7280]" : "text-textc placeholder:text-muted"} ${compact ? "py-2.5 text-[15px]" : "py-3 text-base"}`}
      />
      <button
        type="submit"
        disabled={loading}
        className={`rounded-[10px] font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-4 py-2 text-sm" : "px-[22px] py-3 text-[15px]"}`}
        style={{ background: "var(--accent-2)" }}
      >
        Analisar
      </button>
    </form>
  );
}
