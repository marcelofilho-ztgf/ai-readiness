// Background "seda" em CSS puro — recria o clima do Silk (React Bits) sem WebGL/Three.js.
// Camadas de gradientes cônicos/radiais animados que se movem lentamente,
// imitando dobras de tecido. Funciona em qualquer navegador e é leve.
export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        overflow: "hidden",
        background: "#0a0a0f",
      }}
    >
      {/* camada base: dobras de seda em roxo */}
      <div className="silk-layer silk-a" />
      {/* camada secundária: brilho verde sutil, sentido oposto */}
      <div className="silk-layer silk-b" />
      {/* granulado sutil pra textura de tecido */}
      <div className="silk-grain" />
      {/* overlay pra escurecer e dar contraste */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(130% 90% at 50% 10%, rgba(10,10,15,0), rgba(10,10,15,.55) 85%)",
        }}
      />
    </div>
  );
}
