import { describe, expect, it } from "vitest";
import {
  applyHeatDecay,
  applyHeatGain,
  endChase,
  HEAT_DECAY_PER_SEC,
  HEAT_GAIN,
  HEAT_MAX
} from "./heat";

describe("heat math", () => {
  it("tier 1 prank chips heat without triggering chase", () => {
    const after = applyHeatGain({ value: 0, chasing: false }, 1);
    expect(after.value).toBe(HEAT_GAIN[1]);
    expect(after.chasing).toBe(false);
  });

  it("tier 3 heist (Bacon Run) maxes heat instantly and triggers chase", () => {
    const after = applyHeatGain({ value: 0, chasing: false }, 3);
    expect(after.value).toBe(HEAT_MAX);
    expect(after.chasing).toBe(true);
  });

  it("decays during cooldown when not chasing", () => {
    const after = applyHeatDecay({ value: 50, chasing: false }, 4);
    expect(after.value).toBe(50 - HEAT_DECAY_PER_SEC * 4);
  });

  it("does not decay during a chase — risk persists", () => {
    const after = applyHeatDecay({ value: 100, chasing: true }, 10);
    expect(after.value).toBe(100);
    expect(after.chasing).toBe(true);
  });

  it("endChase resets state to a clean cooldown", () => {
    expect(endChase({ value: 100, chasing: true })).toEqual({
      value: 0,
      chasing: false
    });
  });

  it("accumulating tier-2 schemes eventually triggers chase", () => {
    let state = { value: 0, chasing: false };
    for (let i = 0; i < 5; i++) state = applyHeatGain(state, 2);
    expect(state.chasing).toBe(true);
  });
});
