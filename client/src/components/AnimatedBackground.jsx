// SLOT PARA REACT BITS — background animado.
// Hoje: um gradiente/aurora leve em CSS puro (placeholder bonito).
// Para trocar pelo da React Bits: substitua o conteúdo deste componente
// pelo componente de background que você copiar (ex: Aurora, Particles, Beams).
// O resto do app não precisa mudar — ele só renderiza <AnimatedBackground/> no fundo.

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          width: "900px",
          height: "900px",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle at 30% 30%, rgba(108,92,231,.22), transparent 60%), radial-gradient(circle at 70% 40%, rgba(0,216,160,.16), transparent 55%)",
          filter: "blur(40px)",
          animation: "bgDrift 18s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes bgDrift {
          0%   { transform: translateX(-50%) translateY(0) scale(1); }
          100% { transform: translateX(-50%) translateY(40px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
