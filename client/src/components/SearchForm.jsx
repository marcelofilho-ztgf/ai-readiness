import { useState } from "react";

// Formulário de busca reutilizável (home e modal).
// Input com fundo branco; botão na cor accent-2 (verde "citado por IA").
export default function SearchForm({ onSubmit, loading, className = "", compact = false, initialValue = "" }) {
  const [url, setUrl] = useState(initialValue);

  function handle(e) {
    e.preventDefault();
    onSubmit(url);
  }

  return (
    <form
      onSubmit={handle}
      className={`input-white mx-auto flex max-w-[680px] items-center gap-2 rounded-2xl p-2 ${className}`}
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="text"
        placeholder="cole a URL do seu site, ex: zigpay.com.br"
        autoComplete="off"
        className={`input-white flex-1 rounded-xl bg-transparent px-3.5 outline-none ${compact ? "py-2 text-sm" : "py-3 text-base"}`}
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
