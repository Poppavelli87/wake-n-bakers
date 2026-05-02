import { createStore } from "zustand/vanilla";
import {
  applyDrain,
  applyRecovery,
  COMPOSURE_MAX,
  isMeltdown,
  type ComposureState
} from "../scoring/composure";
import {
  applyHeatGain,
  type HeatState
} from "../scoring/heat";
import { clamp } from "../util/clamp";
import {
  TIP_BASE,
  type CustomerArchetype,
  type CustomerState,
  type GameLogEntry,
  type GameStatus
} from "../shift/shiftState";

export type HamletController = "ai" | "player2";

export type HerbVisitState =
  | "idle"
  | "walking_to_kitchen"
  | "in_kitchen"
  | "returning";

export const VIBES_MIN = 0;
export const VIBES_MAX = 100;
export const VIBES_DEFAULT = 50;

export interface GameState {
  status: GameStatus;
  shiftStartedAt: number | null;
  composure: ComposureState;
  heat: HeatState;
  hospitality: number;
  customersServed: number;
  customersTarget: number;
  baconStolen: number;
  currentCustomer: CustomerState | null;
  log: GameLogEntry[];

  // Sprint 3 additions
  hamletController: HamletController;
  // Set true when bait_swap replaces cooked bacon. Cleared by serve/expire/reset.
  // Plumbing for the canon "Hamlet wins through Chris's downfall" rule:
  // a swapped serve looks identical until the customer rejects it.
  baitSwapped: boolean;

  // Sprint 4 additions — Herb mode
  vibes: number; // Herb's Vibes meter (0-100). Soft amplifier on hospitality.
  herbVisitState: HerbVisitState;
  herbVisitStartedAt: number | null;
  // smoke_signal flips this; the scene reads + clears it to trigger an immediate Herb visit
  pendingHerbVisitTrigger: boolean;
  // Quip Wheel UI state — bridge between Phaser scene and React HUD
  quipWheelOpen: boolean;
  quipWheelContext: string | null;

  // actions — kept on the same shape so Phaser scenes can call them via
  // gameStore.getState().<action>(...) without a separate dispatcher
  startShift: (target: number) => void;
  cookSuccess: () => void;
  applySabotage: (tier: 1 | 2 | 3, kind: string) => void;
  spawnCustomer: (archetype: CustomerArchetype, patience: number) => void;
  serveCurrentCustomer: () => void;
  expireCurrentCustomer: () => void;
  tickPatience: (dtSeconds: number) => void;
  reset: () => void;

  // Sprint 3 actions
  setHamletController: (c: HamletController) => void;
  setBaitSwapped: (v: boolean) => void;
  recordBaconRun: () => void;
  endChaseClean: () => void;

  // Sprint 4 actions
  adjustVibes: (delta: number) => void;
  setHerbVisitState: (s: HerbVisitState) => void;
  triggerHerbVisit: () => void;
  acknowledgeHerbVisit: () => void;
  setQuipWheel: (open: boolean, context?: string | null) => void;
  recordQuip: (
    contextKey: string,
    optionId: string,
    hospitality: number,
    vibesDelta: number
  ) => void;
}

type InitialFields = Omit<
  GameState,
  | "startShift"
  | "cookSuccess"
  | "applySabotage"
  | "spawnCustomer"
  | "serveCurrentCustomer"
  | "expireCurrentCustomer"
  | "tickPatience"
  | "reset"
  | "setHamletController"
  | "setBaitSwapped"
  | "recordBaconRun"
  | "endChaseClean"
  | "adjustVibes"
  | "setHerbVisitState"
  | "triggerHerbVisit"
  | "acknowledgeHerbVisit"
  | "setQuipWheel"
  | "recordQuip"
>;

// hamletController is sticky across reset() — the player's choice of
// AI vs hotseat shouldn't reset on meltdown
const INITIAL_RESETTABLE: Omit<InitialFields, "hamletController"> = {
  status: "idle",
  shiftStartedAt: null,
  composure: { value: COMPOSURE_MAX },
  heat: { value: 0, chasing: false },
  hospitality: 0,
  customersServed: 0,
  customersTarget: 5,
  baconStolen: 0,
  currentCustomer: null,
  log: [],
  baitSwapped: false,
  vibes: VIBES_DEFAULT,
  herbVisitState: "idle",
  herbVisitStartedAt: null,
  pendingHerbVisitTrigger: false,
  quipWheelOpen: false,
  quipWheelContext: null
};

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const gameStore = createStore<GameState>((set, get) => ({
  ...INITIAL_RESETTABLE,
  hamletController: "ai" as HamletController,

  startShift: (target) =>
    set((s) => ({
      ...INITIAL_RESETTABLE,
      hamletController: s.hamletController,
      status: "playing",
      shiftStartedAt: Date.now(),
      customersTarget: target
    })),

  cookSuccess: () => {
    const s = get();
    if (s.status !== "playing") return;
    set({
      composure: applyRecovery(s.composure, "cook"),
      log: [...s.log, { at: Date.now(), kind: "cook_success" }]
    });
  },

  applySabotage: (tier, kind) => {
    const s = get();
    if (s.status !== "playing") return;
    const composure = applyDrain(s.composure, tier);
    const heat = applyHeatGain(s.heat, tier);
    const status: GameStatus = isMeltdown(composure) ? "meltdown" : s.status;
    set({
      composure,
      heat,
      status,
      log: [...s.log, { at: Date.now(), kind: "sabotage", meta: { tier, kind } }]
    });
  },

  spawnCustomer: (archetype, patience) =>
    set((s) => ({
      currentCustomer: {
        id: makeId("cust"),
        archetype,
        patienceMax: patience,
        patienceLeft: patience,
        servedAt: null
      },
      log: [...s.log, { at: Date.now(), kind: "customer_spawn", meta: { archetype } }]
    })),

  serveCurrentCustomer: () => {
    const s = get();
    if (s.status !== "playing" || !s.currentCustomer) return;

    // Bait swap path: customer rejects the rubber decoy. Doesn't count
    // toward target; eats composure; clears the swap flag.
    if (s.baitSwapped) {
      const composure = applyDrain(s.composure, 2);
      const status: GameStatus = isMeltdown(composure) ? "meltdown" : s.status;
      set({
        composure,
        currentCustomer: null,
        baitSwapped: false,
        status,
        log: [...s.log, { at: Date.now(), kind: "customer_rejected_decoy" }]
      });
      return;
    }

    const newCount = s.customersServed + 1;
    const tipBase = TIP_BASE[s.currentCustomer.archetype];
    const tipMod = Math.max(
      0.5,
      s.currentCustomer.patienceLeft / s.currentCustomer.patienceMax
    );
    const hospitalityGain = Math.round(tipBase * tipMod * 5);
    const status: GameStatus =
      newCount >= s.customersTarget ? "shift_complete" : "playing";
    set({
      currentCustomer: { ...s.currentCustomer, servedAt: Date.now() },
      customersServed: newCount,
      hospitality: s.hospitality + hospitalityGain,
      status,
      log: [
        ...s.log,
        { at: Date.now(), kind: "customer_served", meta: { hospitalityGain } }
      ]
    });
  },

  expireCurrentCustomer: () => {
    const s = get();
    if (s.status !== "playing" || !s.currentCustomer) return;
    // Bigger composure hit than a tier-1 prank — losing a customer hurts
    const composure = applyDrain(s.composure, 2);
    const status: GameStatus = isMeltdown(composure) ? "meltdown" : s.status;
    set({
      composure,
      currentCustomer: null,
      status,
      log: [...s.log, { at: Date.now(), kind: "customer_expired" }]
    });
  },

  tickPatience: (dt) => {
    const s = get();
    if (s.status !== "playing" || !s.currentCustomer) return;
    const remaining = s.currentCustomer.patienceLeft - dt;
    if (remaining <= 0) {
      get().expireCurrentCustomer();
      return;
    }
    set({
      currentCustomer: { ...s.currentCustomer, patienceLeft: remaining }
    });
  },

  reset: () =>
    set((s) => ({ ...INITIAL_RESETTABLE, hamletController: s.hamletController })),

  setHamletController: (c) => set({ hamletController: c }),

  setBaitSwapped: (v) => set({ baitSwapped: v }),

  recordBaconRun: () => {
    const s = get();
    if (s.status !== "playing") return;
    // Tier-3 sabotage maxes Heat and starts the chase
    set({
      baconStolen: s.baconStolen + 1,
      heat: applyHeatGain(s.heat, 3),
      composure: applyDrain(s.composure, 3),
      status: isMeltdown(applyDrain(s.composure, 3)) ? "meltdown" : s.status,
      log: [...s.log, { at: Date.now(), kind: "bacon_run" }]
    });
  },

  endChaseClean: () => {
    const s = get();
    set({
      heat: { value: 0, chasing: false },
      log: [...s.log, { at: Date.now(), kind: "chase_ended_clean" }]
    });
  },

  // === Sprint 4 — Herb mode ===

  adjustVibes: (delta) => {
    const s = get();
    const next = clamp(s.vibes + delta, VIBES_MIN, VIBES_MAX);
    set({ vibes: next });
  },

  setHerbVisitState: (state) => {
    const s = get();
    set({
      herbVisitState: state,
      herbVisitStartedAt:
        state === "walking_to_kitchen" || state === "in_kitchen"
          ? s.herbVisitStartedAt ?? Date.now()
          : state === "idle"
          ? null
          : s.herbVisitStartedAt
    });
  },

  triggerHerbVisit: () => {
    set({ pendingHerbVisitTrigger: true });
  },

  acknowledgeHerbVisit: () => {
    set({ pendingHerbVisitTrigger: false });
  },

  setQuipWheel: (open, context = null) => {
    set({
      quipWheelOpen: open,
      quipWheelContext: open ? context : null
    });
  },

  recordQuip: (contextKey, optionId, hospitalityGain, vibesDelta) => {
    const s = get();
    if (s.status !== "playing") return;
    const vibes = clamp(s.vibes + vibesDelta, VIBES_MIN, VIBES_MAX);
    // Vibes amplify hospitality slightly: +/-15% at the extremes
    const vibesMult = 0.85 + (vibes / VIBES_MAX) * 0.3;
    const hospitalityFinal = Math.round(hospitalityGain * vibesMult);
    set({
      hospitality: s.hospitality + hospitalityFinal,
      vibes,
      quipWheelOpen: false,
      quipWheelContext: null,
      log: [
        ...s.log,
        {
          at: Date.now(),
          kind: "quip",
          meta: { contextKey, optionId, hospitalityFinal, vibes }
        }
      ]
    });
  }
}));
