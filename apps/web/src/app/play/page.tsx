"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const PhaserGame = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-skillet-900 text-linen-100 font-display text-xl">
      Warming up the kitchen…
    </div>
  )
});

const Hud = dynamic(() => import("@/components/Hud"), {
  ssr: false
});

const QuipWheel = dynamic(() => import("@/components/QuipWheel"), {
  ssr: false
});

export default function PlayPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-skillet-900 relative">
      <PhaserGame />
      <Hud />
      <QuipWheel />
      <Link
        href="/"
        className="absolute top-1/2 -translate-y-1/2 left-2 z-30 px-2 py-1 rounded-full bg-linen-100/80 text-skillet-900 font-dashboard text-[10px] uppercase tracking-widest hover:bg-butter-500 transition-colors pointer-events-auto"
      >
        ← Back
      </Link>
    </main>
  );
}
