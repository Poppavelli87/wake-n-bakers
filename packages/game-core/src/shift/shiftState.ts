// Shift state shared across the kitchen scene, HUD, and persistence layer.

export type GameStatus = "idle" | "playing" | "meltdown" | "shift_complete";

export type CustomerArchetype = "regular" | "picky" | "vip";

export interface CustomerState {
  id: string;
  archetype: CustomerArchetype;
  patienceMax: number;
  patienceLeft: number;
  servedAt: number | null;
}

export const TIP_BASE: Record<CustomerArchetype, number> = {
  regular: 4,
  picky: 3,
  vip: 12
};

export interface GameLogEntry {
  at: number;
  kind: string;
  meta?: unknown;
}
