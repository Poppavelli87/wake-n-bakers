import * as Phaser from "phaser";
import { gameStore } from "@wnb/game-core";
import { SAVORYVILLE } from "../palette";

// === Layout ===
const W = 1280;
const H = 720;

const PAN_X = 380;
const PAN_Y = 360;
const PASS_X = 1100;
const PASS_Y = 360;
const PLATE_X = 220;
const PLATE_Y = 200;
const CUSTOMER_X = PASS_X + 90;
const CUSTOMER_Y = PASS_Y;
const HAMLET_LURK_X = 1100;
const HAMLET_LURK_Y = 600;
const BACON_RUN_EXIT_X = W + 60;

// === Tuning ===
const CHRIS_SPEED = 220;
const CHASE_SPEED_MULT = 1.55;
const HAMLET_SPEED = 130;
const HAMLET_PLAYER_SPEED = 180;
const HAMLET_BACONRUN_SPEED = 220;
const INTERACT_RANGE = 70;
const PAN_SLAM_RANGE = 95;
const COOK_TIME_MS = 8000;
const SABOTAGE_INTERVAL_MIN_MS = 14000;
const SABOTAGE_INTERVAL_MAX_MS = 24000;
const NEXT_CUSTOMER_DELAY_MS = 4000;
const SABOTAGE_TELEGRAPH_MS = 1100;
const SLICK_LIFETIME_MS = 7000;
const HAMLET_STUN_MS = 3000;
const BURNER_NUDGE_DURATION_MS = 5000;
const PAN_SWAP_OFFSET_PX = 80;
const PAN_SWAP_DURATION_MS = 6000;

type CookState = "empty" | "cooking" | "done" | "ruined";
type Carrying = "nothing" | "cooked_bacon";
type HamletAIState =
  | "lurk"
  | "approach"
  | "sabotage"
  | "flee"
  | "stunned"
  | "bacon_run_grabbing"
  | "bacon_run_escaping";

type SabotageKind =
  | "salt_avalanche"
  | "plate_clatter"
  | "burner_nudge"
  | "pan_swap"
  | "butter_slick"
  | "bait_swap"
  | "timer_reset"
  | "bacon_run";

interface Slick {
  obj: Phaser.GameObjects.Ellipse;
  x: number;
  y: number;
  expiresAt: number;
}

export class KitchenScene extends Phaser.Scene {
  // Chris
  private chris!: Phaser.GameObjects.Container;
  private chrisFloatItem!: Phaser.GameObjects.Rectangle;
  private chrisFryingPan!: Phaser.GameObjects.Rectangle;
  private chrisCarrying: Carrying = "nothing";
  private chrisSlipVel = { x: 0, y: 0 };
  private chrisSlipUntil = 0;

  // Hamlet
  private hamlet!: Phaser.GameObjects.Container;
  private hamletCarriedBacon!: Phaser.GameObjects.Rectangle;
  private hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
  private hamletState: HamletAIState = "lurk";
  private hamletNextSabotageAt = 0;
  private hamletPlannedSabotage: SabotageKind = "salt_avalanche";
  private hamletStunnedUntil = 0;
  private hamletTelegraph!: Phaser.GameObjects.Text;

  // Cooking station
  private panContainer!: Phaser.GameObjects.Container;
  private panBaseX = PAN_X;
  private panBaseY = PAN_Y;
  private panSwappedUntil = 0;
  private panBacon!: Phaser.GameObjects.Rectangle;
  private cookBar!: Phaser.GameObjects.Rectangle;
  private cookBarBg!: Phaser.GameObjects.Rectangle;
  private cookState: CookState = "empty";
  private cookStartedAt = 0;
  private burnerSpeedMult = 1.0;
  private burnerSpeedUntil = 0;
  private ruinedX!: Phaser.GameObjects.Text;

  // Plate stack
  private plateStack!: Phaser.GameObjects.Container;
  private plateStackToppled = false;

  // Slicks
  private slicks: Slick[] = [];

  // Customer
  private customerContainer: Phaser.GameObjects.Container | null = null;
  private customerPatienceFill: Phaser.GameObjects.Rectangle | null = null;
  private customerPatienceBg: Phaser.GameObjects.Rectangle | null = null;
  private lastCustomerResolvedAt = 0;

  // UI
  private interactPrompt!: Phaser.GameObjects.Text;
  private modeBadge!: Phaser.GameObjects.Text;

  // Inputs
  private keysChris!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private keysHamlet!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: "Kitchen" });
  }

  create(): void {
    this.buildFloor();
    this.buildCookingStation();
    this.buildPassThrough();
    this.buildPlateStack();
    this.buildChris();
    this.buildHamlet();

    this.interactPrompt = this.add
      .text(0, 0, "", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "14px",
        color: "#fbf3e3",
        backgroundColor: "#2b201a",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setVisible(false);

    this.modeBadge = this.add
      .text(W / 2, 14, "", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "11px",
        color: "#fbf3e3",
        backgroundColor: "#4a3528",
        padding: { x: 8, y: 3 },
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    const kb = this.input.keyboard!;
    this.keysChris = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.keysHamlet = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    };

    // Chris context-sensitive interact
    kb.on("keydown-E", () => this.tryInteract());
    kb.on("keydown-SPACE", () => this.tryInteract());

    // Chris defensive moves
    kb.on("keydown-Q", () => this.tryCounterWipe());
    kb.on("keydown-X", () => this.tryPanSlam());

    // Mode toggle
    kb.on("keydown-P", () => this.toggleHamletController());

    // Hamlet sabotage hotkeys (only fire when controller === player2)
    kb.on("keydown-ONE", () => this.tryPlayer2Sabotage("salt_avalanche"));
    kb.on("keydown-TWO", () => this.tryPlayer2Sabotage("plate_clatter"));
    kb.on("keydown-THREE", () => this.tryPlayer2Sabotage("butter_slick"));
    kb.on("keydown-FOUR", () => this.tryPlayer2Sabotage("bait_swap"));
    kb.on("keydown-FIVE", () => this.tryPlayer2Sabotage("timer_reset"));
    kb.on("keydown-SIX", () => this.tryPlayer2Sabotage("pan_swap"));
    kb.on("keydown-SEVEN", () => this.tryPlayer2Sabotage("burner_nudge"));
    kb.on("keydown-ENTER", () => this.tryPlayer2Sabotage("bacon_run"));

    // Restart / leave
    kb.on("keydown-ESC", () => {
      window.location.href = "/";
    });
    kb.on("keydown-R", () => {
      const status = gameStore.getState().status;
      if (status === "meltdown" || status === "shift_complete") {
        this.scene.restart();
      }
    });

    // Begin shift
    gameStore.getState().reset();
    gameStore.getState().startShift(5);
    this.lastCustomerResolvedAt = this.time.now;
    this.scheduleNextSabotage();
    this.refreshModeBadge();
  }

  // === Build helpers =======================================================

  private buildFloor(): void {
    this.add.rectangle(0, 0, W, H, SAVORYVILLE.steam300).setOrigin(0, 0);
    for (let x = 0; x < W; x += 80) {
      this.add.line(0, 0, x, 0, x, H, SAVORYVILLE.steam500, 0.18);
    }
    for (let y = 0; y < H; y += 80) {
      this.add.line(0, 0, 0, y, W, y, SAVORYVILLE.steam500, 0.18);
    }
    this.add.rectangle(0, 0, W, 6, SAVORYVILLE.skillet900).setOrigin(0, 0);
    this.add.rectangle(0, H - 6, W, 6, SAVORYVILLE.skillet900).setOrigin(0, 0);
    this.add.rectangle(0, 0, 6, H, SAVORYVILLE.skillet900).setOrigin(0, 0);
    this.add.rectangle(W - 6, 0, 6, H, SAVORYVILLE.skillet900).setOrigin(0, 0);
  }

  private buildCookingStation(): void {
    // Counter underneath stays put
    this.add
      .rectangle(PAN_X, PAN_Y, 180, 150, SAVORYVILLE.skillet700)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add
      .circle(PAN_X, PAN_Y, 52, SAVORYVILLE.sizzle700, 0.55)
      .setStrokeStyle(2, SAVORYVILLE.skillet900);

    // Pan + bacon move together when pan_swap fires
    this.panContainer = this.add.container(PAN_X, PAN_Y);
    const panOuter = this.add.circle(0, 0, 40, SAVORYVILLE.skillet900);
    const panInner = this.add.circle(0, 0, 34, 0x1a1410);
    const panHandle = this.add.rectangle(52, 0, 36, 8, SAVORYVILLE.skillet900);
    this.panBacon = this.add
      .rectangle(0, 0, 42, 10, SAVORYVILLE.bacon500)
      .setStrokeStyle(1, SAVORYVILLE.bacon900)
      .setVisible(false);
    this.panContainer.add([panOuter, panInner, panHandle, this.panBacon]);

    this.cookBarBg = this.add
      .rectangle(PAN_X, PAN_Y - 68, 104, 14, SAVORYVILLE.skillet900)
      .setVisible(false);
    this.cookBar = this.add
      .rectangle(PAN_X - 50, PAN_Y - 68, 0, 9, SAVORYVILLE.sizzle500)
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.ruinedX = this.add
      .text(PAN_X, PAN_Y, "X", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "48px",
        color: "#b23a1a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);

    this.add
      .text(PAN_X, PAN_Y + 90, "STOVE  [E to cook]", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "12px",
        color: "#4a3528",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0);
  }

  private buildPassThrough(): void {
    this.add
      .rectangle(PASS_X, PASS_Y, 130, 230, SAVORYVILLE.butter300)
      .setStrokeStyle(4, SAVORYVILLE.skillet900);
    this.add
      .rectangle(PASS_X, PASS_Y - 130, 140, 22, SAVORYVILLE.skillet700)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add
      .text(PASS_X, PASS_Y - 130, "PASS", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "14px",
        color: "#fbf3e3",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);
    this.add
      .rectangle(PASS_X + 70, H / 2, 100, H - 12, SAVORYVILLE.linen300, 0.5)
      .setOrigin(0, 0.5);
    this.add
      .text(PASS_X + 120, 30, "DINING FLOOR\n(Sprint 4)", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "10px",
        color: "#6b4d39"
      })
      .setOrigin(0, 0);
  }

  private buildPlateStack(): void {
    this.plateStack = this.add.container(PLATE_X, PLATE_Y);
    for (let i = 0; i < 4; i++) {
      const plate = this.add
        .ellipse(0, -i * 4, 60, 14, SAVORYVILLE.linen100)
        .setStrokeStyle(2, SAVORYVILLE.skillet900);
      this.plateStack.add(plate);
    }
    this.add
      .text(PLATE_X, PLATE_Y + 18, "PLATES", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "10px",
        color: "#4a3528"
      })
      .setOrigin(0.5, 0);
  }

  private buildChris(): void {
    this.chris = this.add.container(W / 2, H / 2);
    const body = this.add
      .circle(0, 0, 22, SAVORYVILLE.linen100)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const hair = this.add
      .circle(0, -16, 12, SAVORYVILLE.butter500)
      .setStrokeStyle(2, SAVORYVILLE.skillet900);
    const label = this.add
      .text(0, 36, "Chris", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "12px",
        color: "#2b201a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);
    this.chris.add([body, hair, label]);
    this.chris.setDepth(20);

    this.chrisFloatItem = this.add
      .rectangle(0, -36, 28, 8, SAVORYVILLE.bacon500)
      .setStrokeStyle(1, SAVORYVILLE.bacon900)
      .setVisible(false);
    this.chris.add(this.chrisFloatItem);

    // Frying pan visible only during chase
    this.chrisFryingPan = this.add
      .rectangle(28, 4, 22, 10, SAVORYVILLE.skillet900)
      .setVisible(false);
    this.chris.add(this.chrisFryingPan);
  }

  private buildHamlet(): void {
    this.hamlet = this.add.container(HAMLET_LURK_X, HAMLET_LURK_Y);
    const body = this.add
      .circle(0, 0, 24, SAVORYVILLE.hamletPink)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const eyeL = this.add.circle(-7, -6, 3, SAVORYVILLE.skillet900);
    const eyeR = this.add.circle(7, -6, 3, SAVORYVILLE.skillet900);
    const snout = this.add
      .ellipse(0, 5, 14, 9, 0xd98aa3)
      .setStrokeStyle(2, SAVORYVILLE.skillet900);
    const toque = this.add
      .rectangle(0, -22, 18, 10, SAVORYVILLE.linen100)
      .setStrokeStyle(2, SAVORYVILLE.skillet900);
    const label = this.add
      .text(0, 38, "Hamlet", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "12px",
        color: "#2b201a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);
    this.hamlet.add([body, eyeL, eyeR, snout, toque, label]);
    this.hamlet.setDepth(15);

    this.hamletCarriedBacon = this.add
      .rectangle(0, -36, 30, 9, SAVORYVILLE.sizzle500)
      .setStrokeStyle(1, SAVORYVILLE.bacon900)
      .setVisible(false);
    this.hamlet.add(this.hamletCarriedBacon);

    this.hamletTelegraph = this.add
      .text(0, 0, "", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "16px",
        color: "#fbf3e3",
        backgroundColor: "#b23a1a",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setVisible(false);
  }

  // === Per-frame ============================================================

  override update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const s = gameStore.getState();
    if (s.status !== "playing") return;

    s.tickPatience(dt);

    this.handleChrisMovement(dt);
    if (s.hamletController === "ai") {
      this.handleAIHamlet(dt);
    } else {
      this.handlePlayer2Hamlet(dt);
    }
    this.handleCookingProgress();
    this.handleCustomerSpawn();
    this.updateCustomerPatienceBar();
    this.updateInteractPrompt();
    this.updateChrisCarryVisual();
    this.updateSlicks();
    this.updatePanSwap();
    this.updateBurnerNudgeTimeout();
    this.updateChaseVisuals();
    this.updateHamletStun();
    this.updateBaconRunHamlet(dt);
  }

  // === Chris movement ======================================================

  private handleChrisMovement(dt: number): void {
    let speed = CHRIS_SPEED;
    if (gameStore.getState().heat.chasing) speed *= CHASE_SPEED_MULT;

    let dx = 0;
    let dy = 0;

    if (this.time.now < this.chrisSlipUntil) {
      // Sliding — locked direction, sped up, no input
      dx = this.chrisSlipVel.x;
      dy = this.chrisSlipVel.y;
      speed = CHRIS_SPEED * 1.6;
    } else {
      if (this.keysChris.up.isDown) dy -= 1;
      if (this.keysChris.down.isDown) dy += 1;
      if (this.keysChris.left.isDown) dx -= 1;
      if (this.keysChris.right.isDown) dx += 1;
      // In solo mode arrow keys also drive Chris
      if (gameStore.getState().hamletController === "ai") {
        if (this.keysHamlet.up.isDown) dy -= 1;
        if (this.keysHamlet.down.isDown) dy += 1;
        if (this.keysHamlet.left.isDown) dx -= 1;
        if (this.keysHamlet.right.isDown) dx += 1;
      }
      if (dx === 0 && dy === 0) return;
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const nx = Phaser.Math.Clamp(this.chris.x + dx * speed * dt, 30, W - 110);
    const ny = Phaser.Math.Clamp(this.chris.y + dy * speed * dt, 30, H - 30);
    this.chris.setPosition(nx, ny);

    // Slip-on-slick check
    if (this.time.now > this.chrisSlipUntil) {
      for (const slick of this.slicks) {
        if (Phaser.Math.Distance.Between(nx, ny, slick.x, slick.y) < 32) {
          // Slip in current movement direction
          this.chrisSlipUntil = this.time.now + 600;
          this.chrisSlipVel = { x: dx, y: dy };
          gameStore.getState().applySabotage(2, "slipped_on_slick");
          this.cameras.main.shake(150, 0.003);
          break;
        }
      }
    }
  }

  // === Chris interact ======================================================

  private dist(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
  }

  private panWorldXY(): { x: number; y: number } {
    return { x: this.panContainer.x, y: this.panContainer.y };
  }

  private nearestInteractable(): {
    kind: "stove" | "pass" | null;
  } {
    const stove = this.panWorldXY();
    const stoveDist = this.dist(this.chris, stove);
    const passDist = this.dist(this.chris, { x: PASS_X, y: PASS_Y });
    if (stoveDist <= INTERACT_RANGE && stoveDist <= passDist) {
      return { kind: "stove" };
    }
    if (passDist <= INTERACT_RANGE) {
      return { kind: "pass" };
    }
    return { kind: null };
  }

  private updateInteractPrompt(): void {
    const { kind } = this.nearestInteractable();
    let label = "";
    if (kind === "stove") {
      if (
        this.chrisCarrying === "nothing" &&
        (this.cookState === "empty" || this.cookState === "ruined")
      ) {
        label = "[E] Start cooking";
      } else if (this.cookState === "cooking") {
        label = "Cooking…";
      } else if (this.cookState === "done" && this.chrisCarrying === "nothing") {
        label = "[E] Plate up";
      }
    } else if (kind === "pass") {
      if (this.chrisCarrying === "cooked_bacon") label = "[E] Serve";
    }
    if (!label) {
      this.interactPrompt.setVisible(false);
      return;
    }
    this.interactPrompt
      .setText(label)
      .setPosition(this.chris.x, this.chris.y - 50)
      .setVisible(true);
  }

  private tryInteract(): void {
    if (gameStore.getState().status !== "playing") return;
    const { kind } = this.nearestInteractable();
    if (kind === "stove") this.interactStove();
    else if (kind === "pass") this.interactPass();
  }

  private interactStove(): void {
    if (this.chrisCarrying === "cooked_bacon") return;
    if (this.cookState === "empty" || this.cookState === "ruined") {
      this.startCooking();
    } else if (this.cookState === "done" && this.chrisCarrying === "nothing") {
      this.plateUp();
    }
  }

  private interactPass(): void {
    if (this.chrisCarrying !== "cooked_bacon") return;
    const s = gameStore.getState();
    if (!s.currentCustomer) return;
    s.serveCurrentCustomer();
    this.chrisCarrying = "nothing";
    this.chrisFloatItem.setVisible(false);
    this.removeCustomer();
    this.lastCustomerResolvedAt = this.time.now;
  }

  // === Chris defensive moves ===============================================

  private tryCounterWipe(): void {
    if (gameStore.getState().status !== "playing") return;
    const idx = this.slicks.findIndex(
      (slick) => this.dist(this.chris, slick) < 60
    );
    if (idx === -1) return;
    const slick = this.slicks[idx];
    if (slick) {
      slick.obj.destroy();
      this.slicks.splice(idx, 1);
      // Small composure recovery — reward for awareness
      gameStore.getState().cookSuccess();
    }
  }

  private tryPanSlam(): void {
    if (gameStore.getState().status !== "playing") return;
    if (this.dist(this.chris, this.hamlet) > PAN_SLAM_RANGE) return;
    this.stunHamlet();
    // If chasing, the chase ends clean
    if (gameStore.getState().heat.chasing) {
      // If Hamlet had grabbed the bacon, drop it back where he was hit
      if (
        this.hamletState === "bacon_run_grabbing" ||
        this.hamletState === "bacon_run_escaping"
      ) {
        this.hamletCarriedBacon.setVisible(false);
      }
      gameStore.getState().endChaseClean();
    }
    // Smash visual
    const flash = this.add
      .circle(this.hamlet.x, this.hamlet.y, 50, SAVORYVILLE.butter500, 0.7)
      .setDepth(50);
    this.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 240,
      onComplete: () => flash.destroy()
    });
    this.cameras.main.shake(180, 0.005);
  }

  private stunHamlet(): void {
    this.hamletStunnedUntil = this.time.now + HAMLET_STUN_MS;
    this.hamletState = "stunned";
    this.hamletTarget = { x: this.hamlet.x, y: this.hamlet.y };
    this.hamletTelegraph
      .setText("STUNNED")
      .setPosition(this.hamlet.x, this.hamlet.y - 40)
      .setVisible(true);
    this.tweens.add({
      targets: this.hamlet,
      angle: { from: -15, to: 15 },
      yoyo: true,
      repeat: 6,
      duration: HAMLET_STUN_MS / 14
    });
  }

  private updateHamletStun(): void {
    if (this.hamletState !== "stunned") return;
    if (this.time.now >= this.hamletStunnedUntil) {
      this.hamletTelegraph.setVisible(false);
      this.hamlet.setAngle(0);
      this.hamletState = "lurk";
      this.hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
      this.scheduleNextSabotage();
    }
  }

  // === Cooking station =====================================================

  private startCooking(): void {
    this.cookState = "cooking";
    this.cookStartedAt = this.time.now;
    gameStore.getState().setBaitSwapped(false);
    this.panBacon.setVisible(true).setFillStyle(SAVORYVILLE.bacon500);
    this.cookBarBg.setVisible(true);
    this.cookBar.setVisible(true).width = 0;
    this.ruinedX.setVisible(false);
    this.tweens.killTweensOf(this.panBacon);
    this.tweens.add({
      targets: this.panBacon,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 280
    });
  }

  private handleCookingProgress(): void {
    if (this.cookState !== "cooking") return;
    const speedMult = this.burnerSpeedMult;
    const elapsed = (this.time.now - this.cookStartedAt) * speedMult;
    const progress = Math.min(1, elapsed / COOK_TIME_MS);
    this.cookBar.width = Math.round(progress * 100);
    if (progress >= 1) {
      this.cookState = "done";
      this.tweens.killTweensOf(this.panBacon);
      this.panBacon.setAlpha(1).setFillStyle(SAVORYVILLE.sizzle500);
      this.cookBarBg.setVisible(false);
      this.cookBar.setVisible(false);
      gameStore.getState().cookSuccess();
    } else if (progress < 0) {
      // Burner nudge backwards — visual cue
      this.cookBar.width = 0;
    }
  }

  private plateUp(): void {
    this.cookState = "empty";
    this.panBacon.setVisible(false);
    this.tweens.killTweensOf(this.panBacon);
    this.chrisCarrying = "cooked_bacon";
    const swapped = gameStore.getState().baitSwapped;
    this.chrisFloatItem
      .setFillStyle(swapped ? 0xb89a78 : SAVORYVILLE.sizzle500)
      .setVisible(true);
  }

  private updateChrisCarryVisual(): void {
    if (this.chrisCarrying === "nothing") this.chrisFloatItem.setVisible(false);
  }

  private updateBurnerNudgeTimeout(): void {
    if (this.burnerSpeedMult !== 1.0 && this.time.now > this.burnerSpeedUntil) {
      this.burnerSpeedMult = 1.0;
    }
  }

  private updatePanSwap(): void {
    if (
      this.panSwappedUntil > 0 &&
      this.time.now > this.panSwappedUntil
    ) {
      // Slide back home
      this.tweens.add({
        targets: this.panContainer,
        x: this.panBaseX,
        y: this.panBaseY,
        duration: 350,
        ease: "Sine.InOut"
      });
      this.panSwappedUntil = 0;
    }
  }

  // === Hamlet AI ===========================================================

  private scheduleNextSabotage(): void {
    const delay = Phaser.Math.Between(
      SABOTAGE_INTERVAL_MIN_MS,
      SABOTAGE_INTERVAL_MAX_MS
    );
    this.hamletNextSabotageAt = this.time.now + delay;
  }

  private aiPickSabotage(): SabotageKind {
    // Tier-3 if cooked bacon is there and no chase active — opportunistic
    const s = gameStore.getState();
    if (this.cookState === "done" && !s.heat.chasing && Math.random() < 0.5) {
      return "bacon_run";
    }
    // Tier-2 mix
    const tier2Roll = Math.random();
    if (this.cookState === "cooking" && tier2Roll < 0.25) return "timer_reset";
    if (this.cookState === "done" && tier2Roll < 0.4) return "bait_swap";
    if (tier2Roll < 0.55) return "butter_slick";
    // Tier-1 mix
    if (this.cookState === "cooking" && Math.random() < 0.55) return "salt_avalanche";
    if (this.cookState === "cooking" && Math.random() < 0.5) return "burner_nudge";
    if (!this.plateStackToppled && Math.random() < 0.5) return "plate_clatter";
    return "pan_swap";
  }

  private sabotageTarget(kind: SabotageKind): { x: number; y: number } {
    switch (kind) {
      case "salt_avalanche":
      case "burner_nudge":
      case "pan_swap":
      case "timer_reset":
      case "bait_swap":
      case "bacon_run":
        return { x: this.panContainer.x, y: this.panContainer.y - 6 };
      case "plate_clatter":
        return { x: PLATE_X, y: PLATE_Y };
      case "butter_slick": {
        // Drop near a chokepoint between Chris and pass-through
        const cx = (this.chris.x + PASS_X) / 2;
        return { x: Phaser.Math.Clamp(cx, 200, PASS_X - 100), y: PASS_Y };
      }
    }
  }

  private handleAIHamlet(dt: number): void {
    if (this.hamletState === "stunned") return;
    if (this.hamletState === "bacon_run_grabbing" || this.hamletState === "bacon_run_escaping") {
      return; // handled in updateBaconRunHamlet
    }

    // Walk toward target
    const dx = this.hamletTarget.x - this.hamlet.x;
    const dy = this.hamletTarget.y - this.hamlet.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 4) {
      const step = Math.min(HAMLET_SPEED * dt, d);
      this.hamlet.x += (dx / d) * step;
      this.hamlet.y += (dy / d) * step;
    }

    if (this.hamletState === "lurk") {
      if (this.time.now >= this.hamletNextSabotageAt) {
        this.hamletPlannedSabotage = this.aiPickSabotage();
        this.hamletTarget = this.sabotageTarget(this.hamletPlannedSabotage);
        this.hamletState = "approach";
      }
    } else if (this.hamletState === "approach") {
      if (d < 8) {
        this.hamletState = "sabotage";
        this.executeSabotage(this.hamletPlannedSabotage);
      }
    } else if (this.hamletState === "flee") {
      if (d < 8) {
        this.hamletState = "lurk";
        this.scheduleNextSabotage();
      }
    }
  }

  // === Player-2 control ====================================================

  private handlePlayer2Hamlet(dt: number): void {
    if (this.hamletState === "stunned") return;
    if (
      this.hamletState === "bacon_run_grabbing" ||
      this.hamletState === "bacon_run_escaping"
    ) {
      return; // bacon-run animations override input
    }
    let dx = 0;
    let dy = 0;
    if (this.keysHamlet.up.isDown) dy -= 1;
    if (this.keysHamlet.down.isDown) dy += 1;
    if (this.keysHamlet.left.isDown) dx -= 1;
    if (this.keysHamlet.right.isDown) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      const nx = Phaser.Math.Clamp(
        this.hamlet.x + dx * HAMLET_PLAYER_SPEED * dt,
        30,
        W - 30
      );
      const ny = Phaser.Math.Clamp(
        this.hamlet.y + dy * HAMLET_PLAYER_SPEED * dt,
        30,
        H - 30
      );
      this.hamlet.setPosition(nx, ny);
    }
  }

  private tryPlayer2Sabotage(kind: SabotageKind): void {
    const s = gameStore.getState();
    if (s.status !== "playing") return;
    if (s.hamletController !== "player2") return;
    if (this.hamletState === "stunned") return;
    if (
      this.hamletState === "bacon_run_grabbing" ||
      this.hamletState === "bacon_run_escaping"
    )
      return;

    // Proximity check for context-bound sabotages
    const panClose =
      this.dist(this.hamlet, this.panWorldXY()) < INTERACT_RANGE * 1.2;
    const platesClose =
      this.dist(this.hamlet, { x: PLATE_X, y: PLATE_Y }) < INTERACT_RANGE * 1.2;

    switch (kind) {
      case "salt_avalanche":
      case "burner_nudge":
      case "pan_swap":
      case "timer_reset":
      case "bait_swap":
      case "bacon_run":
        if (!panClose) return;
        break;
      case "plate_clatter":
        if (!platesClose) return;
        break;
      case "butter_slick":
        // anywhere
        break;
    }

    this.hamletPlannedSabotage = kind;
    this.executeSabotage(kind, /*p2*/ true);
  }

  // === Execute sabotage ====================================================

  private executeSabotage(kind: SabotageKind, p2 = false): void {
    if (kind === "bacon_run") {
      this.startBaconRun();
      return;
    }

    const label = this.sabotageLabel(kind);
    this.hamletTelegraph
      .setText(label)
      .setPosition(this.hamlet.x, this.hamlet.y - 40)
      .setVisible(true);
    this.tweens.add({
      targets: this.hamlet,
      angle: { from: -8, to: 8 },
      yoyo: true,
      repeat: 2,
      duration: SABOTAGE_TELEGRAPH_MS / 6
    });

    // P2 sabotages have a shorter telegraph (player has agency, less hand-holding)
    const tel = p2 ? Math.round(SABOTAGE_TELEGRAPH_MS * 0.55) : SABOTAGE_TELEGRAPH_MS;

    this.time.delayedCall(tel, () => {
      this.hamletTelegraph.setVisible(false);
      this.hamlet.setAngle(0);
      if (gameStore.getState().status !== "playing") return;
      this.applySabotageEffect(kind);
      if (!p2) {
        // AI flees back to lurk; P2 keeps control
        this.hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
        this.hamletState = "flee";
      }
    });
  }

  private sabotageLabel(kind: SabotageKind): string {
    switch (kind) {
      case "salt_avalanche":
        return "SALT!";
      case "plate_clatter":
        return "CRASH!";
      case "burner_nudge":
        return "FLAME!";
      case "pan_swap":
        return "SWAP!";
      case "butter_slick":
        return "SLICK!";
      case "bait_swap":
        return "FAKE!";
      case "timer_reset":
        return "RESET!";
      case "bacon_run":
        return "RUN!";
    }
  }

  private applySabotageEffect(kind: SabotageKind): void {
    switch (kind) {
      case "salt_avalanche":
        this.applySaltAvalanche();
        break;
      case "plate_clatter":
        this.applyPlateClatter();
        break;
      case "burner_nudge":
        this.applyBurnerNudge();
        break;
      case "pan_swap":
        this.applyPanSwap();
        break;
      case "butter_slick":
        this.applyButterSlick();
        break;
      case "bait_swap":
        this.applyBaitSwap();
        break;
      case "timer_reset":
        this.applyTimerReset();
        break;
    }
  }

  // === Tier-1 sabotages ====================================================

  private applySaltAvalanche(): void {
    if (this.cookState === "cooking" || this.cookState === "done") {
      this.cookState = "ruined";
      this.tweens.killTweensOf(this.panBacon);
      this.panBacon
        .setVisible(true)
        .setFillStyle(SAVORYVILLE.skillet500)
        .setAlpha(1);
      this.cookBarBg.setVisible(false);
      this.cookBar.setVisible(false);
      this.ruinedX.setVisible(true);
      gameStore.getState().applySabotage(1, "salt_avalanche");
      this.cameras.main.shake(180, 0.004);
    } else {
      gameStore.getState().applySabotage(1, "salt_whiff");
    }
  }

  private applyPlateClatter(): void {
    if (!this.plateStackToppled) {
      this.plateStackToppled = true;
      this.tweens.add({
        targets: this.plateStack,
        angle: 12,
        x: PLATE_X + 14,
        duration: 200
      });
      for (let i = 0; i < 4; i++) {
        const px = PLATE_X + Phaser.Math.Between(-50, 50);
        const py = PLATE_Y + Phaser.Math.Between(40, 70);
        this.add
          .ellipse(px, py, 50, 12, SAVORYVILLE.linen100, 0.95)
          .setStrokeStyle(2, SAVORYVILLE.skillet900)
          .setAngle(Phaser.Math.Between(-30, 30));
      }
    }
    gameStore.getState().applySabotage(1, "plate_clatter");
    this.cameras.main.shake(140, 0.003);
  }

  private applyBurnerNudge(): void {
    // Random direction: cook way faster (still gets done but Chris loses agency)
    // OR way slower / reverses (reset progress visibly).
    const harsh = Math.random() < 0.5 ? 0.35 : 1.9;
    this.burnerSpeedMult = harsh;
    this.burnerSpeedUntil = this.time.now + BURNER_NUDGE_DURATION_MS;
    gameStore.getState().applySabotage(1, "burner_nudge");
    this.cameras.main.flash(120, 232, 118, 31);
  }

  private applyPanSwap(): void {
    if (this.cookState === "ruined") {
      gameStore.getState().applySabotage(1, "pan_swap_whiff");
      return;
    }
    const dir = Math.random() < 0.5 ? -1 : 1;
    const targetX = this.panBaseX + dir * PAN_SWAP_OFFSET_PX;
    this.tweens.add({
      targets: this.panContainer,
      x: targetX,
      duration: 320,
      ease: "Sine.InOut"
    });
    this.panSwappedUntil = this.time.now + PAN_SWAP_DURATION_MS;
    gameStore.getState().applySabotage(1, "pan_swap");
  }

  // === Tier-2 sabotages ====================================================

  private applyButterSlick(): void {
    const x = this.hamlet.x;
    const y = this.hamlet.y;
    const slickEll = this.add
      .ellipse(x, y, 56, 20, SAVORYVILLE.butter500, 0.85)
      .setStrokeStyle(2, SAVORYVILLE.skillet900)
      .setDepth(8);
    this.tweens.add({
      targets: slickEll,
      alpha: { from: 0.85, to: 0.5 },
      yoyo: true,
      repeat: -1,
      duration: 600
    });
    this.slicks.push({
      obj: slickEll,
      x,
      y,
      expiresAt: this.time.now + SLICK_LIFETIME_MS
    });
    gameStore.getState().applySabotage(2, "butter_slick");
  }

  private updateSlicks(): void {
    for (let i = this.slicks.length - 1; i >= 0; i--) {
      const slick = this.slicks[i];
      if (slick && this.time.now > slick.expiresAt) {
        slick.obj.destroy();
        this.slicks.splice(i, 1);
      }
    }
  }

  private applyBaitSwap(): void {
    if (this.cookState !== "done") {
      gameStore.getState().applySabotage(2, "bait_swap_whiff");
      return;
    }
    // Visually subtle — dull the cooked color slightly so the joke pays off later
    this.panBacon.setFillStyle(0xb89a78);
    gameStore.getState().setBaitSwapped(true);
    gameStore.getState().applySabotage(2, "bait_swap");
  }

  private applyTimerReset(): void {
    if (this.cookState !== "cooking") {
      gameStore.getState().applySabotage(2, "timer_reset_whiff");
      return;
    }
    this.cookStartedAt = this.time.now;
    this.cookBar.width = 0;
    gameStore.getState().applySabotage(2, "timer_reset");
    this.cameras.main.shake(80, 0.002);
  }

  // === Tier-3 Bacon Run ====================================================

  private startBaconRun(): void {
    if (this.cookState !== "done") {
      // No bacon to grab — small composure tax
      gameStore.getState().applySabotage(1, "bacon_run_whiff");
      return;
    }
    this.hamletState = "bacon_run_grabbing";
    this.hamletTarget = { x: this.panContainer.x, y: this.panContainer.y };
    this.hamletTelegraph
      .setText("BACON RUN!")
      .setPosition(this.hamlet.x, this.hamlet.y - 40)
      .setVisible(true);
    this.cameras.main.shake(220, 0.006);
  }

  private updateBaconRunHamlet(dt: number): void {
    if (
      this.hamletState !== "bacon_run_grabbing" &&
      this.hamletState !== "bacon_run_escaping"
    ) {
      return;
    }

    const dx = this.hamletTarget.x - this.hamlet.x;
    const dy = this.hamletTarget.y - this.hamlet.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 4) {
      const step = Math.min(HAMLET_BACONRUN_SPEED * dt, d);
      this.hamlet.x += (dx / d) * step;
      this.hamlet.y += (dy / d) * step;
    }

    if (this.hamletState === "bacon_run_grabbing" && d < 8) {
      // Snatch the bacon
      this.cookState = "empty";
      this.panBacon.setVisible(false);
      this.cookBarBg.setVisible(false);
      this.cookBar.setVisible(false);
      this.ruinedX.setVisible(false);
      this.hamletCarriedBacon.setVisible(true);
      // Trigger the Heat-maxing tier-3
      gameStore.getState().recordBaconRun();
      this.hamletState = "bacon_run_escaping";
      this.hamletTarget = { x: BACON_RUN_EXIT_X, y: PASS_Y };
      this.hamletTelegraph
        .setText("ESCAPING!")
        .setPosition(this.hamlet.x, this.hamlet.y - 40)
        .setVisible(true);
    } else if (this.hamletState === "bacon_run_escaping" && this.hamlet.x >= W - 10) {
      // Hamlet escaped with the bacon
      this.hamletTelegraph.setVisible(false);
      this.hamletCarriedBacon.setVisible(false);
      // Bacon stolen counter is already incremented in recordBaconRun
      gameStore.getState().endChaseClean();
      // Teleport back to lurk after a beat
      this.hamlet.setPosition(HAMLET_LURK_X, HAMLET_LURK_Y);
      this.hamletState = "lurk";
      this.hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
      this.scheduleNextSabotage();
    }
  }

  private updateChaseVisuals(): void {
    const chasing = gameStore.getState().heat.chasing;
    this.chrisFryingPan.setVisible(chasing);
  }

  // === Customer ============================================================

  private handleCustomerSpawn(): void {
    const s = gameStore.getState();
    if (s.currentCustomer) return;
    if (s.customersServed >= s.customersTarget) return;
    if (this.time.now - this.lastCustomerResolvedAt < NEXT_CUSTOMER_DELAY_MS)
      return;

    const roll = Math.random();
    const archetype: "regular" | "picky" | "vip" =
      roll < 0.55 ? "regular" : roll < 0.85 ? "picky" : "vip";
    const patience = archetype === "vip" ? 35 : archetype === "picky" ? 50 : 65;
    s.spawnCustomer(archetype, patience);
    this.spawnCustomerSprite(archetype);
  }

  private spawnCustomerSprite(archetype: "regular" | "picky" | "vip"): void {
    const color =
      archetype === "vip"
        ? SAVORYVILLE.bacon700
        : archetype === "picky"
        ? SAVORYVILLE.skillet500
        : SAVORYVILLE.sizzle300;

    this.customerContainer = this.add.container(CUSTOMER_X, CUSTOMER_Y);
    const body = this.add
      .rectangle(0, 0, 50, 70, color)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const head = this.add
      .circle(0, -50, 18, SAVORYVILLE.linen300)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const label = this.add
      .text(0, 50, archetype.toUpperCase(), {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "10px",
        color: "#2b201a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0);
    this.customerContainer.add([body, head, label]);
    this.customerContainer.setDepth(10);

    this.customerPatienceBg = this.add
      .rectangle(CUSTOMER_X, CUSTOMER_Y - 90, 70, 10, SAVORYVILLE.skillet900)
      .setDepth(11);
    this.customerPatienceFill = this.add
      .rectangle(CUSTOMER_X - 33, CUSTOMER_Y - 90, 64, 6, SAVORYVILLE.butter500)
      .setOrigin(0, 0.5)
      .setDepth(12);

    this.customerContainer.setScale(0.4);
    this.tweens.add({
      targets: this.customerContainer,
      scale: 1,
      duration: 240,
      ease: "Back.Out"
    });
  }

  private removeCustomer(): void {
    if (this.customerContainer) {
      this.tweens.add({
        targets: this.customerContainer,
        alpha: 0,
        x: CUSTOMER_X + 40,
        duration: 250,
        onComplete: () => this.customerContainer?.destroy()
      });
      this.customerContainer = null;
    }
    if (this.customerPatienceBg) {
      this.customerPatienceBg.destroy();
      this.customerPatienceBg = null;
    }
    if (this.customerPatienceFill) {
      this.customerPatienceFill.destroy();
      this.customerPatienceFill = null;
    }
  }

  private updateCustomerPatienceBar(): void {
    const s = gameStore.getState();
    if (!s.currentCustomer || !this.customerPatienceFill) {
      if (!s.currentCustomer && this.customerContainer) {
        this.removeCustomer();
        this.lastCustomerResolvedAt = this.time.now;
      }
      return;
    }
    const ratio = Math.max(
      0,
      s.currentCustomer.patienceLeft / s.currentCustomer.patienceMax
    );
    this.customerPatienceFill.width = Math.round(64 * ratio);
    const color =
      ratio > 0.5
        ? SAVORYVILLE.butter500
        : ratio > 0.25
        ? SAVORYVILLE.sizzle500
        : SAVORYVILLE.bacon500;
    this.customerPatienceFill.setFillStyle(color);
  }

  // === Mode toggle =========================================================

  private toggleHamletController(): void {
    const s = gameStore.getState();
    const next = s.hamletController === "ai" ? "player2" : "ai";
    s.setHamletController(next);
    if (next === "ai") {
      // Re-arm AI
      this.hamletState = "lurk";
      this.hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
      this.scheduleNextSabotage();
    } else {
      this.hamletState = "lurk";
      this.hamletTarget = { x: this.hamlet.x, y: this.hamlet.y };
    }
    this.refreshModeBadge();
  }

  private refreshModeBadge(): void {
    const c = gameStore.getState().hamletController;
    this.modeBadge.setText(
      c === "ai" ? "AI HAMLET  ·  P to toggle" : "P2 HAMLET  ·  arrows + 1-7 / Enter"
    );
  }
}
