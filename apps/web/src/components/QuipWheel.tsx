"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import { gameStore, type GameState } from "@wnb/game-core";
import { quips } from "@wnb/content";

const selOpen = (s: GameState) => s.quipWheelOpen;
const selContext = (s: GameState) => s.quipWheelContext;
const selStatus = (s: GameState) => s.status;

interface QuipOption {
  id: string;
  text: string;
  tone: "polite" | "non_sequitur" | "wildcard" | "silent_beat";
  score?: {
    hospitality?: number;
    vibes?: number;
    disrupt_chris?: number;
  };
}

interface QuipsContext {
  options: QuipOption[];
}

interface QuipsCorpus {
  contexts: Record<string, QuipsContext>;
}

const TONE_BG: Record<QuipOption["tone"], string> = {
  polite: "bg-butter-300 hover:bg-butter-500",
  non_sequitur: "bg-sizzle-300 hover:bg-sizzle-500",
  wildcard: "bg-bacon-100 hover:bg-bacon-300",
  silent_beat: "bg-steam-300 hover:bg-linen-300"
};

const TONE_LABEL: Record<QuipOption["tone"], string> = {
  polite: "polite",
  non_sequitur: "non sequitur",
  wildcard: "wildcard",
  silent_beat: "..."
};

export default function QuipWheel() {
  const open = useStore(gameStore, selOpen);
  const context = useStore(gameStore, selContext);
  const status = useStore(gameStore, selStatus);

  // Keyboard 1-4 to select while wheel open
  useEffect(() => {
    if (!open || !context) return;
    const corpus = quips as QuipsCorpus;
    const ctx = corpus.contexts[context];
    if (!ctx) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        const option = ctx.options[idx];
        if (option) {
          e.stopPropagation();
          pick(option, context);
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, context]);

  if (!open || !context || status !== "playing") return null;

  const corpus = quips as QuipsCorpus;
  const ctx = corpus.contexts[context];
  if (!ctx) return null;

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="bg-linen-100 rounded-2xl shadow-2xl ring-4 ring-skillet-900 p-4 w-[520px]">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-dashboard text-[10px] uppercase tracking-widest text-skillet-700">
            Herb says…
          </p>
          <p className="font-dashboard text-[9px] uppercase tracking-widest text-skillet-500">
            1-4 keys · click · auto-closes
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ctx.options.map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => pick(opt, context)}
              className={`text-left p-3 rounded ring-2 ring-skillet-900 transition-colors ${TONE_BG[opt.tone]}`}
            >
              <span className="font-display text-base font-bold text-skillet-900 mr-1">
                {i + 1}.
              </span>
              <span className="font-body text-sm text-skillet-900">
                {opt.text || "..."}
              </span>
              <p className="font-dashboard text-[9px] uppercase tracking-widest text-skillet-700/70 mt-1">
                {TONE_LABEL[opt.tone]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function pick(option: QuipOption, contextKey: string): void {
  const h = option.score?.hospitality ?? 0;
  const v = option.score?.vibes ?? 0;
  const d = option.score?.disrupt_chris ?? 0;
  gameStore.getState().recordQuip(contextKey, option.id, h, v);
  if (d) {
    // disrupt_chris is negative — translates to a tier-1 composure tax on Chris
    gameStore.getState().applySabotage(1, "quip_disrupt");
  }
}
