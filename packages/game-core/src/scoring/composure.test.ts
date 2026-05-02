import { describe, expect, it } from "vitest";
import {
  applyDrain,
  applyRecovery,
  COMPOSURE_DRAIN,
  COMPOSURE_MAX,
  COMPOSURE_MIN,
  COMPOSURE_RECOVER_COOK,
  COMPOSURE_RECOVER_COVER,
  isMeltdown,
  tier
} from "./composure";

describe("composure math", () => {
  it("starts calm at max", () => {
    expect(tier({ value: COMPOSURE_MAX })).toBe("calm");
  });

  it("drains by tier amount", () => {
    expect(applyDrain({ value: COMPOSURE_MAX }, 1).value).toBe(
      COMPOSURE_MAX - COMPOSURE_DRAIN[1]
    );
    expect(applyDrain({ value: COMPOSURE_MAX }, 2).value).toBe(
      COMPOSURE_MAX - COMPOSURE_DRAIN[2]
    );
    expect(applyDrain({ value: COMPOSURE_MAX }, 3).value).toBe(
      COMPOSURE_MAX - COMPOSURE_DRAIN[3]
    );
  });

  it("clamps at zero on overflow drain and triggers meltdown", () => {
    const after = applyDrain({ value: 5 }, 3);
    expect(after.value).toBe(COMPOSURE_MIN);
    expect(isMeltdown(after)).toBe(true);
  });

  it("cover-up recovery is meaningfully larger than cook recovery", () => {
    const fromCook = applyRecovery({ value: 50 }, "cook");
    const fromCover = applyRecovery({ value: 50 }, "cover");
    expect(fromCook.value).toBe(50 + COMPOSURE_RECOVER_COOK);
    expect(fromCover.value).toBe(50 + COMPOSURE_RECOVER_COVER);
    expect(fromCover.value).toBeGreaterThan(fromCook.value);
  });

  it("clamps at max on recovery", () => {
    expect(applyRecovery({ value: 95 }, "cover").value).toBe(COMPOSURE_MAX);
  });

  it("tier escalates as value decreases", () => {
    expect(tier({ value: 80 })).toBe("calm");
    expect(tier({ value: 60 })).toBe("tense");
    expect(tier({ value: 30 })).toBe("fraying");
    expect(tier({ value: 10 })).toBe("snapping");
    expect(tier({ value: 0 })).toBe("broken");
  });

  it("recovery is ~3x slower than tier-1 drain — by design", () => {
    expect(COMPOSURE_DRAIN[1]).toBeGreaterThan(COMPOSURE_RECOVER_COOK);
  });
});
