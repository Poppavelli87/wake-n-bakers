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

export default function PlayPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-skillet-900 relative">
      <PhaserGame />
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-linen-100/90 text-skillet-900 font-display text-sm hover:bg-butter-500 transition-colors"
      >
        ← Back
      </Link>
    </main>
  );
}
