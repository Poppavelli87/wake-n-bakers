import { clamp } from "../util/clamp";

// Hamlet's Heat meter. Sabotage tiers add Heat at different rates.
// Heat decays during cooldown. Maxed Heat triggers a chase.

export const HEAT_MAX = 100;
export const HEAT_MIN = 0;

export const HEAT_GAIN: Record<1 | 2 | 3, number> = {
  1: 8,
  2: 20,
  3: 100
};

export const HEAT_DECAY_PER_SEC = 3;

export interface HeatState {
  value: number;
  chasing: boolean;
}

export function applyHeatGain(state: HeatState, tier: 1 | 2 | 3): HeatState {
  const next = clamp(state.value + HEAT_GAIN[tier], HEAT_MIN, HEAT_MAX);
  return {
    value: next,
    chasing: state.chasing || next >= HEAT_MAX
  };
}

export function applyHeatDecay(state: HeatState, dtSeconds: number): HeatState {
  if (state.chasing) return state;
  return {
    ...state,
    value: clamp(state.value - HEAT_DECAY_PER_SEC * dtSeconds, HEAT_MIN, HEAT_MAX)
  };
}

export function endChase(_state: HeatState): HeatState {
  return { value: 0, chasing: false };
}
