// Fundo "seda" animado — em DIVs reais (não pseudo-elementos), porque o Chrome
// não anima ::before/::after de forma confiável quando há filter:blur pesado.
export default function AnimatedBackground() {
  return (
    <div className="silk-bg" aria-hidden>
      <div className="silk-blob" />
      <div className="silk-sheen" />
      <div className="silk-vignette" />
    </div>
  );
}
