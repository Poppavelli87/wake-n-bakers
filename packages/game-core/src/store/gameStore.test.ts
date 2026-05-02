import { beforeEach, describe, expect, it } from "vitest";
import { gameStore, VIBES_DEFAULT, VIBES_MAX, VIBES_MIN } from "./gameStore";
import { COMPOSURE_MAX } from "../scoring/composure";
import { HEAT_MAX } from "../scoring/heat";

describe("gameStore", () => {
  beforeEach(() => {
    // Reset everything including controller for test isolation
    gameStore.getState().setHamletController("ai");
    gameStore.getState().reset();
  });

  it("starts idle with full composure and zero heat", () => {
    const s = gameStore.getState();
    expect(s.status).toBe("idle");
    expect(s.composure.value).toBe(COMPOSURE_MAX);
    expect(s.heat).toEqual({ value: 0, chasing: false });
    expect(s.hospitality).toBe(0);
    expect(s.customersServed).toBe(0);
  });

  it("startShift moves to playing and sets the target", () => {
    gameStore.getState().startShift(5);
    const s = gameStore.getState();
    expect(s.status).toBe("playing");
    expect(s.customersTarget).toBe(5);
    expect(s.shiftStartedAt).not.toBeNull();
  });

  it("applySabotage during play drains composure and adds heat", () => {
    gameStore.getState().startShift(5);
    gameStore.getState().applySabotage(1, "salt_avalanche");
    const s = gameStore.getState();
    expect(s.composure.value).toBeLessThan(COMPOSURE_MAX);
    expect(s.heat.value).toBeGreaterThan(0);
  });

  it("ignores sabotage when not playing", () => {
    gameStore.getState().applySabotage(2, "scheme");
    expect(gameStore.getState().composure.value).toBe(COMPOSURE_MAX);
  });

  it("driving composure to zero transitions to meltdown", () => {
    gameStore.getState().startShift(5);
    for (let i = 0; i < 8; i++) {
      gameStore.getState().applySabotage(2, "scheme");
    }
    expect(gameStore.getState().status).toBe("meltdown");
  });

  it("serving a customer increments count and adds hospitality scaled by patience", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.spawnCustomer("regular", 60);
    s.serveCurrentCustomer();
    const after = gameStore.getState();
    expect(after.customersServed).toBe(1);
    expect(after.hospitality).toBeGreaterThan(0);
    expect(after.currentCustomer?.servedAt).not.toBeNull();
    expect(after.status).toBe("playing");
  });

  it("VIP served at full patience tips bigger than a regular at full patience", () => {
    gameStore.getState().startShift(5);
    gameStore.getState().spawnCustomer("regular", 60);
    gameStore.getState().serveCurrentCustomer();
    const regularGain = gameStore.getState().hospitality;
    gameStore.getState().reset();
    gameStore.getState().startShift(5);
    gameStore.getState().spawnCustomer("vip", 60);
    gameStore.getState().serveCurrentCustomer();
    const vipGain = gameStore.getState().hospitality;
    expect(vipGain).toBeGreaterThan(regularGain);
  });

  it("hitting the customer target ends the shift in shift_complete", () => {
    const s = gameStore.getState();
    s.startShift(2);
    s.spawnCustomer("regular", 60);
    s.serveCurrentCustomer();
    s.spawnCustomer("regular", 60);
    s.serveCurrentCustomer();
    expect(gameStore.getState().status).toBe("shift_complete");
  });

  it("tickPatience reduces patience and expires the customer at zero", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.spawnCustomer("regular", 5);
    s.tickPatience(3);
    expect(gameStore.getState().currentCustomer?.patienceLeft).toBeCloseTo(2);
    s.tickPatience(3);
    const after = gameStore.getState();
    expect(after.currentCustomer).toBeNull();
    expect(after.composure.value).toBeLessThan(COMPOSURE_MAX);
  });

  it("expireCurrentCustomer with low composure can trigger meltdown", () => {
    const s = gameStore.getState();
    s.startShift(5);
    // 7 tier-2 sabotages -> composure 2 (still playing).
    // Then expire drains 14 -> clamps to 0 -> meltdown.
    for (let i = 0; i < 7; i++) s.applySabotage(2, "scheme");
    expect(gameStore.getState().status).toBe("playing");
    s.spawnCustomer("regular", 5);
    s.expireCurrentCustomer();
    expect(gameStore.getState().status).toBe("meltdown");
  });

  // === Sprint 3 additions ===

  it("hamletController toggles between AI and player2 and survives reset", () => {
    gameStore.getState().setHamletController("player2");
    expect(gameStore.getState().hamletController).toBe("player2");
    gameStore.getState().reset();
    expect(gameStore.getState().hamletController).toBe("player2");
    gameStore.getState().setHamletController("ai");
    expect(gameStore.getState().hamletController).toBe("ai");
  });

  it("startShift preserves hamletController across resets", () => {
    gameStore.getState().setHamletController("player2");
    gameStore.getState().startShift(5);
    expect(gameStore.getState().hamletController).toBe("player2");
  });

  it("bait_swap path: serving a swapped item rejects, no hospitality, composure damage", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.spawnCustomer("regular", 60);
    s.setBaitSwapped(true);
    const before = gameStore.getState().composure.value;
    s.serveCurrentCustomer();
    const after = gameStore.getState();
    expect(after.customersServed).toBe(0); // rejected, doesn't count
    expect(after.hospitality).toBe(0);
    expect(after.composure.value).toBeLessThan(before);
    expect(after.baitSwapped).toBe(false); // cleared after rejection
    expect(after.currentCustomer).toBeNull();
  });

  it("bait_swap clears on shift restart", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.setBaitSwapped(true);
    s.startShift(5);
    expect(gameStore.getState().baitSwapped).toBe(false);
  });

  it("recordBaconRun increments baconStolen, maxes Heat, starts chase, drains composure", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.recordBaconRun();
    const after = gameStore.getState();
    expect(after.baconStolen).toBe(1);
    expect(after.heat.value).toBe(HEAT_MAX);
    expect(after.heat.chasing).toBe(true);
    expect(after.composure.value).toBeLessThan(COMPOSURE_MAX);
  });

  it("endChaseClean resets heat and clears chase", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.recordBaconRun();
    expect(gameStore.getState().heat.chasing).toBe(true);
    s.endChaseClean();
    expect(gameStore.getState().heat.value).toBe(0);
    expect(gameStore.getState().heat.chasing).toBe(false);
  });

  // === Sprint 4 — Herb mode ===

  it("vibes start at default and clamp to [0, 100]", () => {
    expect(gameStore.getState().vibes).toBe(VIBES_DEFAULT);
    gameStore.getState().adjustVibes(200);
    expect(gameStore.getState().vibes).toBe(VIBES_MAX);
    gameStore.getState().adjustVibes(-500);
    expect(gameStore.getState().vibes).toBe(VIBES_MIN);
  });

  it("herbVisitState transitions and tracks startedAt", () => {
    const s = gameStore.getState();
    expect(s.herbVisitState).toBe("idle");
    expect(s.herbVisitStartedAt).toBeNull();
    s.setHerbVisitState("walking_to_kitchen");
    expect(gameStore.getState().herbVisitStartedAt).not.toBeNull();
    s.setHerbVisitState("idle");
    expect(gameStore.getState().herbVisitStartedAt).toBeNull();
  });

  it("triggerHerbVisit sets the pending flag for the scene to consume", () => {
    expect(gameStore.getState().pendingHerbVisitTrigger).toBe(false);
    gameStore.getState().triggerHerbVisit();
    expect(gameStore.getState().pendingHerbVisitTrigger).toBe(true);
    gameStore.getState().acknowledgeHerbVisit();
    expect(gameStore.getState().pendingHerbVisitTrigger).toBe(false);
  });

  it("setQuipWheel toggles open + context, closing clears context", () => {
    const s = gameStore.getState();
    s.setQuipWheel(true, "greet_customer");
    let st = gameStore.getState();
    expect(st.quipWheelOpen).toBe(true);
    expect(st.quipWheelContext).toBe("greet_customer");
    s.setQuipWheel(false);
    st = gameStore.getState();
    expect(st.quipWheelOpen).toBe(false);
    expect(st.quipWheelContext).toBeNull();
  });

  it("recordQuip applies vibes delta + hospitality scaled by vibes multiplier", () => {
    const s = gameStore.getState();
    s.startShift(5);
    // High vibes -> hospitality boosted slightly
    s.adjustVibes(50); // 100 vibes
    const before = gameStore.getState().hospitality;
    s.recordQuip("greet_customer", "warm_welcome", 10, 5);
    const after = gameStore.getState();
    // 1.15x at max vibes -> 11 or 12
    expect(after.hospitality).toBeGreaterThan(before);
    expect(after.hospitality - before).toBeLessThanOrEqual(15);
    // wheel auto-closes
    expect(after.quipWheelOpen).toBe(false);
  });

  it("recordQuip vibes multiplier penalizes low vibes", () => {
    const s = gameStore.getState();
    s.startShift(5);
    s.adjustVibes(-50); // 0 vibes
    s.recordQuip("greet_customer", "warm_welcome", 10, 0);
    const after = gameStore.getState();
    // 0.85x at min vibes -> 8 or 9
    expect(after.hospitality).toBeLessThan(10);
  });

  it("vibes reset to default on shift restart", () => {
    const s = gameStore.getState();
    s.adjustVibes(40);
    s.startShift(5);
    expect(gameStore.getState().vibes).toBe(VIBES_DEFAULT);
  });
});
