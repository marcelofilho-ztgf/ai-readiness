// Background animado — usa o componente Silk (React Bits) em fullscreen fixo.
// O Silk (Three.js) é carregado sob demanda (lazy) para a página inicial abrir
// rápido; o background aparece assim que o chunk pesado termina de baixar.
import { lazy, Suspense } from "react";

const Silk = lazy(() => import("./Silk.jsx"));

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", background: "var(--bg)" }}
    >
      <Suspense fallback={null}>
        <Silk speed={5} scale={1} color="#3a2d6b" noiseIntensity={1.4} rotation={0} />
      </Suspense>
      {/* overlay pra escurecer e dar contraste ao texto/glass */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(10,10,15,.25), rgba(10,10,15,.78) 70%)",
        }}
      />
    </div>
  );
}
