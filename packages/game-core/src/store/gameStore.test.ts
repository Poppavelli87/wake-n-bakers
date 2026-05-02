import { beforeEach, describe, expect, it } from "vitest";
import { gameStore } from "./gameStore";
import { COMPOSURE_MAX } from "../scoring/composure";

describe("gameStore", () => {
  beforeEach(() => {
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
});
