import { clamp } from "../util/clamp";

// Chris's Composure meter. Drains fast on sabotage, recovers slow on cooks.
// Asymmetry = survival rhythm.

export const COMPOSURE_MAX = 100;
export const COMPOSURE_MIN = 0;

export const COMPOSURE_DRAIN: Record<1 | 2 | 3, number> = {
  1: 6,
  2: 14,
  3: 28
};

export const COMPOSURE_RECOVER_COOK = 4;
export const COMPOSURE_RECOVER_COVER = 12;

export interface ComposureState {
  value: number;
}

export function applyDrain(
  state: ComposureState,
  tier: 1 | 2 | 3
): ComposureState {
  return {
    value: clamp(state.value - COMPOSURE_DRAIN[tier], COMPOSURE_MIN, COMPOSURE_MAX)
  };
}

export function applyRecovery(
  state: ComposureState,
  kind: "cook" | "cover"
): ComposureState {
  const delta =
    kind === "cook" ? COMPOSURE_RECOVER_COOK : COMPOSURE_RECOVER_COVER;
  return {
    value: clamp(state.value + delta, COMPOSURE_MIN, COMPOSURE_MAX)
  };
}

export function isMeltdown(state: ComposureState): boolean {
  return state.value <= COMPOSURE_MIN;
}

export type ComposureTier =
  | "calm"
  | "tense"
  | "fraying"
  | "snapping"
  | "broken";

export function tier(state: ComposureState): ComposureTier {
  if (state.value > 75) return "calm";
  if (state.value > 50) return "tense";
  if (state.value > 25) return "fraying";
  if (state.value > 0) return "snapping";
  return "broken";
}
