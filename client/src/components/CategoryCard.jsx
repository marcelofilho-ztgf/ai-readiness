// SLOT PARA REACT BITS — card com microinteração.
// Hoje: card com hover + barra de progresso animada + efeito spotlight no mouse (CSS puro).
// Para trocar pelo da React Bits: envolva o conteúdo com o componente de card
// que você copiar (ex: SpotlightCard, TiltedCard, GlowCard) mantendo as props.

import { useRef } from "react";

function colorForPct(pct) {
  if (pct >= 75) return "var(--ok)";
  if (pct >= 45) return "var(--media)";
  return "var(--alta)";
}

export default function CategoryCard({ name, desc, score, max, pct }) {
  const ref = useRef(null);

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  const color = colorForPct(pct);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="group relative overflow-hidden rounded-xl border border-borderc bg-panel px-[18px] py-4 transition-colors hover:border-accent/60"
      style={{
        background:
          "radial-gradient(420px circle at var(--mx, -100px) var(--my, -100px), rgba(108,92,231,.12), transparent 40%), var(--panel)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="text-[15px] font-semibold">{name}</span>{" "}
          <span className="text-[13px] font-normal text-muted">{desc}</span>
        </div>
        <div
          className="text-[15px] font-bold tabular-nums"
          style={{ color }}
        >
          {score}/{max}
        </div>
      </div>
      <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-panel2">
        <i
          className="block h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
