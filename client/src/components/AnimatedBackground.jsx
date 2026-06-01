// Background Silk (React Bits / WebGL). O wrapper tem dimensão explícita
// (100vw x 100vh) — sem isso o Canvas do fiber nasce com altura 0 e fica preto.
import { lazy, Suspense } from "react";
const Silk = lazy(() => import("./Silk.jsx"));

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
        zIndex: 0,
        overflow: "hidden",
        background: "#14101f",
      }}
    >
      <Suspense fallback={null}>
        <Silk speed={5} scale={1} color="#3a2d6b" noiseIntensity={1.4} rotation={0} />
      </Suspense>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(130% 95% at 50% 6%, rgba(12,10,22,0), rgba(12,10,22,.45) 90%)",
        }}
      />
    </div>
  );
}
