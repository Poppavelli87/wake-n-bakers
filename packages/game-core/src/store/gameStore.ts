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
import {
  TIP_BASE,
  type CustomerArchetype,
  type CustomerState,
  type GameLogEntry,
  type GameStatus
} from "../shift/shiftState";

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
>;

const INITIAL: InitialFields = {
  status: "idle",
  shiftStartedAt: null,
  composure: { value: COMPOSURE_MAX },
  heat: { value: 0, chasing: false },
  hospitality: 0,
  customersServed: 0,
  customersTarget: 5,
  baconStolen: 0,
  currentCustomer: null,
  log: []
};

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const gameStore = createStore<GameState>((set, get) => ({
  ...INITIAL,

  startShift: (target) =>
    set({
      ...INITIAL,
      status: "playing",
      shiftStartedAt: Date.now(),
      customersTarget: target
    }),

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

  reset: () => set({ ...INITIAL })
}));
