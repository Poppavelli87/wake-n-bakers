"use client";

import { useStore } from "zustand";
import {
  COMPOSURE_MAX,
  composureTier,
  gameStore,
  HEAT_MAX,
  type GameState
} from "@wnb/game-core";

const selComposure = (s: GameState) => s.composure.value;
const selStatus = (s: GameState) => s.status;
const selCustomer = (s: GameState) => s.currentCustomer;
const selHospitality = (s: GameState) => s.hospitality;
const selServed = (s: GameState) => s.customersServed;
const selTarget = (s: GameState) => s.customersTarget;
const selHeat = (s: GameState) => s.heat.value;
const selChasing = (s: GameState) => s.heat.chasing;
const selBaconStolen = (s: GameState) => s.baconStolen;
const selController = (s: GameState) => s.hamletController;

export default function Hud() {
  const composure = useStore(gameStore, selComposure);
  const status = useStore(gameStore, selStatus);
  const customer = useStore(gameStore, selCustomer);
  const hospitality = useStore(gameStore, selHospitality);
  const served = useStore(gameStore, selServed);
  const target = useStore(gameStore, selTarget);
  const heat = useStore(gameStore, selHeat);
  const chasing = useStore(gameStore, selChasing);
  const baconStolen = useStore(gameStore, selBaconStolen);
  const controller = useStore(gameStore, selController);

  const composurePct = (composure / COMPOSURE_MAX) * 100;
  const heatPct = (heat / HEAT_MAX) * 100;
  const tier = composureTier({ value: composure });
  const composureColor =
    tier === "calm"
      ? "bg-butter-500"
      : tier === "tense"
      ? "bg-sizzle-300"
      : tier === "fraying"
      ? "bg-sizzle-500"
      : "bg-bacon-500";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* Top-left: Composure */}
      <div className="absolute top-4 left-4 w-72">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-display text-sm font-semibold text-linen-100 drop-shadow">
            Chris&apos;s Composure
          </span>
          <span className="font-dashboard text-xs uppercase tracking-widest text-linen-300/80">
            {tier}
          </span>
        </div>
        <div className="h-4 w-full rounded-full bg-skillet-900/80 ring-2 ring-skillet-900 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${composureColor}`}
            style={{ width: `${composurePct}%` }}
          />
        </div>
      </div>

      {/* Top-right: Hospitality dashboard kitsch */}
      <div className="absolute top-4 right-4 bg-bacon-900 p-1 shadow-lg">
        <div className="bg-dash-teal px-3 py-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-linen-100">
            Hospitality
          </p>
          <div className="flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-linen-100 leading-none">
              {hospitality}
            </span>
            <span className="font-dashboard text-xs text-linen-100/80 mb-1">
              {served}/{target} served
            </span>
          </div>
          {baconStolen > 0 && (
            <p className="font-dashboard text-[10px] text-linen-100/80 mt-1">
              bacon stolen: {baconStolen}
            </p>
          )}
        </div>
      </div>

      {/* Top-center CHASE banner */}
      {chasing && status === "playing" && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-bacon-700 px-6 py-2 border-y-4 border-skillet-900 shadow-lg animate-pulse">
          <p className="font-display text-2xl font-bold text-linen-100 tracking-widest">
            CHASE — X to pan slam
          </p>
        </div>
      )}

      {/* Bottom-left: Heat */}
      {(heat > 0 || chasing) && (
        <div className="absolute bottom-4 left-4 w-48">
          <div className="font-display text-xs font-semibold text-linen-100 mb-1 drop-shadow">
            Hamlet Heat {chasing && <span className="text-bacon-300">· CHASING</span>}
          </div>
          <div className="h-2 w-full rounded-full bg-skillet-900/80 ring-1 ring-skillet-900 overflow-hidden">
            <div
              className={`h-full transition-all ${chasing ? "bg-bacon-500" : "bg-sizzle-500"}`}
              style={{ width: `${heatPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom-center: customer order ticket */}
      {customer && status === "playing" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-linen-100 px-4 py-2 rounded-lg shadow-lg ring-2 ring-skillet-900">
          <p className="font-dashboard text-[10px] uppercase tracking-widest text-skillet-700">
            Order
          </p>
          <p className="font-display text-base font-semibold text-bacon-500">
            {customer.archetype === "vip"
              ? "VIP — Bacon Flight"
              : customer.archetype === "picky"
              ? "Bacon — well done, no grease"
              : "Bacon Plate"}
          </p>
        </div>
      )}

      {/* Center overlays */}
      {status === "meltdown" && (
        <CenterOverlay
          title="MELTDOWN"
          subtitle="Apron hits the floor."
          tone="bacon"
        />
      )}
      {status === "shift_complete" && (
        <CenterOverlay
          title="SHIFT COMPLETE"
          subtitle={`Hospitality ${hospitality}  ·  ${served} served${baconStolen ? `  ·  ${baconStolen} bacon stolen` : ""}`}
          tone="butter"
        />
      )}

      {/* Bottom-right controls reminder */}
      <div className="absolute bottom-4 right-4 max-w-[280px] text-right space-y-1">
        <p className="text-[10px] font-dashboard uppercase tracking-widest text-linen-300/80">
          P1 Chris: WASD · E interact · Q wipe · X slam
        </p>
        {controller === "player2" ? (
          <p className="text-[10px] font-dashboard uppercase tracking-widest text-butter-300/90">
            P2 Hamlet: arrows · 1 salt · 2 plates · 3 slick · 4 fake · 5 reset · 6 swap · 7 burner · Enter run
          </p>
        ) : (
          <p className="text-[10px] font-dashboard uppercase tracking-widest text-linen-300/60">
            P toggle 2P · R restart · Esc back
          </p>
        )}
      </div>
    </div>
  );
}

function CenterOverlay({
  title,
  subtitle,
  tone
}: {
  title: string;
  subtitle: string;
  tone: "bacon" | "butter";
}) {
  const bg = tone === "bacon" ? "bg-bacon-700/95" : "bg-butter-500/95";
  const text = tone === "bacon" ? "text-linen-100" : "text-skillet-900";
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center ${bg} backdrop-blur-sm`}
    >
      <h1 className={`font-display text-7xl font-bold ${text} drop-shadow-lg`}>
        {title}
      </h1>
      <p className={`mt-4 font-display text-xl ${text} opacity-80`}>
        {subtitle}
      </p>
      <p className={`mt-8 font-dashboard text-xs uppercase tracking-[0.4em] ${text} opacity-60`}>
        Press R to restart
      </p>
    </div>
  );
}
