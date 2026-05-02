"use client";

import { useEffect, useRef } from "react";
import type * as Phaser from "phaser";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    let cancelled = false;
    const parent = containerRef.current;

    (async () => {
      const { createGame } = await import("@wnb/game");
      if (cancelled) return;
      gameRef.current = createGame(parent);
    })();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
