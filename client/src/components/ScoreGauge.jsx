import { useEffect, useState } from "react";

function colorForScore(s) {
  if (s >= 70) return "var(--accent-2)";
  if (s >= 50) return "var(--media)";
  return "var(--alta)";
}

export default function ScoreGauge({ score }) {
  const [cur, setCur] = useState(0);
  const circ = 364;

  useEffect(() => {
    let raf;
    let v = 0;
    const step = () => {
      v += Math.max(1, Math.round(score / 30));
      if (v >= score) v = score;
      setCur(v);
      if (v < score) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const color = colorForScore(score);

  return (
    <div className="relative h-[96px] w-[96px] flex-shrink-0 sm:h-[132px] sm:w-[132px]">
      <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
        <circle cx="66" cy="66" r="58" fill="none" stroke="var(--panel-2)" strokeWidth="12" />
        <circle
          cx="66"
          cy="66"
          r="58"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * cur) / 100}
          style={{ transition: "stroke-dashoffset .1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-[28px] font-bold leading-none sm:text-[38px]">{cur}</b>
        <span className="text-[10px] text-muted sm:text-xs">/ 100</span>
      </div>
    </div>
  );
}
