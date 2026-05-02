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

// === Tuning ===
const CHRIS_SPEED = 220; // px/sec
const HAMLET_SPEED = 130;
const INTERACT_RANGE = 70;
const COOK_TIME_MS = 8000;
const SABOTAGE_INTERVAL_MIN_MS = 14000;
const SABOTAGE_INTERVAL_MAX_MS = 24000;
const NEXT_CUSTOMER_DELAY_MS = 4000;
const SABOTAGE_TELEGRAPH_MS = 1200;

type CookState = "empty" | "cooking" | "done" | "ruined";
type Carrying = "nothing" | "raw_bacon" | "cooked_bacon";
type HamletAIState = "lurk" | "approach" | "sabotage" | "flee";
type SabotageKind = "salt_avalanche" | "plate_clatter";

export class KitchenScene extends Phaser.Scene {
  // Chris
  private chris!: Phaser.GameObjects.Container;
  private chrisFloatItem!: Phaser.GameObjects.Rectangle;
  private chrisCarrying: Carrying = "nothing";

  // Hamlet
  private hamlet!: Phaser.GameObjects.Container;
  private hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
  private hamletState: HamletAIState = "lurk";
  private hamletNextSabotageAt = 0;
  private hamletPlannedSabotage: SabotageKind = "salt_avalanche";
  private hamletTelegraph!: Phaser.GameObjects.Text;

  // Cooking station
  private panBacon!: Phaser.GameObjects.Rectangle;
  private cookBar!: Phaser.GameObjects.Rectangle;
  private cookBarBg!: Phaser.GameObjects.Rectangle;
  private cookState: CookState = "empty";
  private cookStartedAt = 0;
  private ruinedX!: Phaser.GameObjects.Text;

  // Plate stack (visual only — sabotage target)
  private plateStack!: Phaser.GameObjects.Container;
  private plateStackToppled = false;

  // Customer
  private customerContainer: Phaser.GameObjects.Container | null = null;
  private customerPatienceFill: Phaser.GameObjects.Rectangle | null = null;
  private customerPatienceBg: Phaser.GameObjects.Rectangle | null = null;
  private lastCustomerResolvedAt = 0;

  // Prompts
  private interactPrompt!: Phaser.GameObjects.Text;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    upArr: Phaser.Input.Keyboard.Key;
    downArr: Phaser.Input.Keyboard.Key;
    leftArr: Phaser.Input.Keyboard.Key;
    rightArr: Phaser.Input.Keyboard.Key;
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

    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      upArr: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      downArr: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      leftArr: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      rightArr: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    };
    kb.on("keydown-E", () => this.tryInteract());
    kb.on("keydown-SPACE", () => this.tryInteract());
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
    // Wall trim
    this.add.rectangle(0, 0, W, 6, SAVORYVILLE.skillet900).setOrigin(0, 0);
    this.add.rectangle(0, H - 6, W, 6, SAVORYVILLE.skillet900).setOrigin(0, 0);
    this.add.rectangle(0, 0, 6, H, SAVORYVILLE.skillet900).setOrigin(0, 0);
    this.add.rectangle(W - 6, 0, 6, H, SAVORYVILLE.skillet900).setOrigin(0, 0);
  }

  private buildCookingStation(): void {
    // Counter
    this.add
      .rectangle(PAN_X, PAN_Y, 150, 150, SAVORYVILLE.skillet700)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    // Burner glow
    this.add
      .circle(PAN_X, PAN_Y, 52, SAVORYVILLE.sizzle700, 0.55)
      .setStrokeStyle(2, SAVORYVILLE.skillet900);
    // Pan
    this.add.circle(PAN_X, PAN_Y, 40, SAVORYVILLE.skillet900);
    this.add.circle(PAN_X, PAN_Y, 34, 0x1a1410);
    this.add.rectangle(PAN_X + 52, PAN_Y, 36, 8, SAVORYVILLE.skillet900);

    this.panBacon = this.add
      .rectangle(PAN_X, PAN_Y, 42, 10, SAVORYVILLE.bacon500)
      .setStrokeStyle(1, SAVORYVILLE.bacon900)
      .setVisible(false);

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

    // Dining floor strip on the right (just visual hint)
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
    // Body (white coat)
    const body = this.add
      .circle(0, 0, 22, SAVORYVILLE.linen100)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    // Hair (blonde)
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

    // Floating carry indicator
    this.chrisFloatItem = this.add
      .rectangle(0, -36, 28, 8, SAVORYVILLE.bacon500)
      .setStrokeStyle(1, SAVORYVILLE.bacon900)
      .setVisible(false);
    this.chris.add(this.chrisFloatItem);
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

  // === Per-frame update =====================================================

  override update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const s = gameStore.getState();
    if (s.status !== "playing") return;

    s.tickPatience(dt);

    this.handleChrisMovement(dt);
    this.handleHamletAI(dt);
    this.handleCookingProgress();
    this.handleCustomerSpawn();
    this.updateCustomerPatienceBar();
    this.updateInteractPrompt();
    this.updateChrisCarryVisual();
  }

  // === Chris movement & interact ===========================================

  private handleChrisMovement(dt: number): void {
    let dx = 0;
    let dy = 0;
    if (this.keys.up.isDown || this.keys.upArr.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.downArr.isDown) dy += 1;
    if (this.keys.left.isDown || this.keys.leftArr.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.rightArr.isDown) dx += 1;
    if (dx === 0 && dy === 0) return;
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    const nx = Phaser.Math.Clamp(this.chris.x + dx * CHRIS_SPEED * dt, 30, W - 110);
    const ny = Phaser.Math.Clamp(this.chris.y + dy * CHRIS_SPEED * dt, 30, H - 30);
    this.chris.setPosition(nx, ny);
  }

  private dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
  }

  private nearestInteractable(): { kind: "stove" | "pass" | null; target: { x: number; y: number } | null } {
    const stoveDist = this.dist(this.chris, { x: PAN_X, y: PAN_Y });
    const passDist = this.dist(this.chris, { x: PASS_X, y: PASS_Y });
    if (stoveDist <= INTERACT_RANGE && stoveDist <= passDist) {
      return { kind: "stove", target: { x: PAN_X, y: PAN_Y } };
    }
    if (passDist <= INTERACT_RANGE) {
      return { kind: "pass", target: { x: PASS_X, y: PASS_Y } };
    }
    return { kind: null, target: null };
  }

  private updateInteractPrompt(): void {
    const { kind } = this.nearestInteractable();
    let label = "";
    if (kind === "stove") {
      if (this.chrisCarrying === "nothing" && (this.cookState === "empty" || this.cookState === "ruined")) label = "[E] Start cooking";
      else if (this.cookState === "cooking") label = "Cooking…";
      else if (this.cookState === "done" && this.chrisCarrying === "nothing") label = "[E] Plate up";
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
    if (this.chrisCarrying === "cooked_bacon" || this.chrisCarrying === "raw_bacon") return;
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

  // === Cooking station ======================================================

  private startCooking(): void {
    this.cookState = "cooking";
    this.cookStartedAt = this.time.now;
    this.panBacon.setVisible(true).setFillStyle(SAVORYVILLE.bacon500);
    this.cookBarBg.setVisible(true);
    this.cookBar.setVisible(true).width = 0;
    this.ruinedX.setVisible(false);
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
    const elapsed = this.time.now - this.cookStartedAt;
    const progress = Math.min(1, elapsed / COOK_TIME_MS);
    this.cookBar.width = Math.round(progress * 100);
    if (progress >= 1) {
      this.cookState = "done";
      this.tweens.killTweensOf(this.panBacon);
      this.panBacon.setAlpha(1).setFillStyle(SAVORYVILLE.sizzle500);
      this.cookBarBg.setVisible(false);
      this.cookBar.setVisible(false);
      gameStore.getState().cookSuccess();
    }
  }

  private plateUp(): void {
    this.cookState = "empty";
    this.panBacon.setVisible(false);
    this.tweens.killTweensOf(this.panBacon);
    this.chrisCarrying = "cooked_bacon";
    this.chrisFloatItem
      .setFillStyle(SAVORYVILLE.sizzle500)
      .setVisible(true);
  }

  private updateChrisCarryVisual(): void {
    // Container handles position; just toggle visibility/color
    if (this.chrisCarrying === "nothing") {
      this.chrisFloatItem.setVisible(false);
    }
  }

  // === Hamlet AI ============================================================

  private scheduleNextSabotage(): void {
    const delay = Phaser.Math.Between(SABOTAGE_INTERVAL_MIN_MS, SABOTAGE_INTERVAL_MAX_MS);
    this.hamletNextSabotageAt = this.time.now + delay;
  }

  private pickSabotage(): SabotageKind {
    // Salt avalanche only viable while cooking; plate clatter always works
    if (this.cookState === "cooking" && Math.random() < 0.7) return "salt_avalanche";
    if (!this.plateStackToppled && Math.random() < 0.5) return "plate_clatter";
    return this.cookState === "cooking" ? "salt_avalanche" : "plate_clatter";
  }

  private sabotageTarget(kind: SabotageKind): { x: number; y: number } {
    if (kind === "salt_avalanche") return { x: PAN_X + 12, y: PAN_Y - 50 };
    return { x: PLATE_X, y: PLATE_Y };
  }

  private handleHamletAI(dt: number): void {
    // Move toward target
    const dx = this.hamletTarget.x - this.hamlet.x;
    const dy = this.hamletTarget.y - this.hamlet.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 4) {
      const move = HAMLET_SPEED * dt;
      const step = Math.min(move, d);
      this.hamlet.x += (dx / d) * step;
      this.hamlet.y += (dy / d) * step;
    }

    if (this.hamletState === "lurk") {
      if (this.time.now >= this.hamletNextSabotageAt) {
        this.hamletPlannedSabotage = this.pickSabotage();
        this.hamletTarget = this.sabotageTarget(this.hamletPlannedSabotage);
        this.hamletState = "approach";
      }
    } else if (this.hamletState === "approach") {
      if (d < 6) {
        this.hamletState = "sabotage";
        this.executeSabotage(this.hamletPlannedSabotage);
      }
    } else if (this.hamletState === "flee") {
      if (d < 6) {
        this.hamletState = "lurk";
        this.scheduleNextSabotage();
      }
    }
  }

  private executeSabotage(kind: SabotageKind): void {
    const label = kind === "salt_avalanche" ? "SALT!" : "CRASH!";
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
    this.time.delayedCall(SABOTAGE_TELEGRAPH_MS, () => {
      this.hamletTelegraph.setVisible(false);
      this.hamlet.setAngle(0);
      if (gameStore.getState().status !== "playing") return;
      if (kind === "salt_avalanche") this.applySaltAvalanche();
      else if (kind === "plate_clatter") this.applyPlateClatter();
      // Flee back to lurk
      this.hamletTarget = { x: HAMLET_LURK_X, y: HAMLET_LURK_Y };
      this.hamletState = "flee";
    });
  }

  private applySaltAvalanche(): void {
    if (this.cookState === "cooking" || this.cookState === "done") {
      this.cookState = "ruined";
      this.tweens.killTweensOf(this.panBacon);
      this.panBacon.setVisible(true).setFillStyle(SAVORYVILLE.skillet500).setAlpha(1);
      this.cookBarBg.setVisible(false);
      this.cookBar.setVisible(false);
      this.ruinedX.setVisible(true);
      gameStore.getState().applySabotage(1, "salt_avalanche");
      this.cameras.main.shake(180, 0.004);
    } else {
      // Whiff — nothing to ruin, smaller composure tax
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
      // Toppled plates as scattered ovals
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

  // === Customer =============================================================

  private handleCustomerSpawn(): void {
    const s = gameStore.getState();
    if (s.currentCustomer) return;
    if (s.customersServed >= s.customersTarget) return;
    if (this.time.now - this.lastCustomerResolvedAt < NEXT_CUSTOMER_DELAY_MS) return;

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

    // Bounce in
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
      // Customer expired in store but sprite still here — clean up
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
}
