import * as Phaser from "phaser";
import { gameStore } from "@wnb/game-core";
import { SAVORYVILLE } from "../palette";

const DINING_GROUND_Y = 640;
const DOOR_X = 100;
const DOOR_KITCHEN_LURK_Y = 250;
const HERB_DINING_SPEED = 100;
const HERB_VISIT_DURATION_MS = 8000;
const HERB_VISIT_INTERVAL_MIN = 60000;
const HERB_VISIT_INTERVAL_MAX = 90000;
const DINING_X_MIN = 200;
const DINING_X_MAX = 1100;

/**
 * Herb — burly bearded chef. Wanders the dining floor, periodically visits
 * the kitchen via the doorway. Eternally oblivious (per locked rule); his
 * visits look the same whether or not chaos is unfolding around him.
 */
export class Herb {
  container: Phaser.GameObjects.Container;
  scene: Phaser.Scene;
  diningTargetX = 600;
  nextDirChangeAt = 0;
  visitState: "idle" | "walking_to_door" | "entering_kitchen" | "in_kitchen" | "exiting_kitchen" | "leaving_door" = "idle";
  nextVisitTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y);

    const apron = scene.add
      .rectangle(0, -25, 50, 70, SAVORYVILLE.linen100)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const shirt = scene.add.rectangle(0, -55, 56, 35, SAVORYVILLE.skillet900);
    const head = scene.add
      .circle(0, -90, 24, SAVORYVILLE.bacon100)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const beard = scene.add.ellipse(0, -82, 32, 22, SAVORYVILLE.skillet900);
    const smile = scene.add.arc(0, -82, 12, 200, 340, false, SAVORYVILLE.skillet900);
    smile.setClosePath(false);
    const label = scene.add
      .text(0, 30, "Herb", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "12px",
        color: "#2b201a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0);

    this.container.add([apron, shirt, head, beard, smile, label]);
    this.container.setDepth(15);

    this.nextVisitTimer =
      scene.time.now + Phaser.Math.Between(HERB_VISIT_INTERVAL_MIN, HERB_VISIT_INTERVAL_MAX);
    this.scheduleNextDirChange();
  }

  private scheduleNextDirChange(): void {
    this.diningTargetX = Phaser.Math.Between(DINING_X_MIN, DINING_X_MAX);
    this.nextDirChangeAt = this.scene.time.now + Phaser.Math.Between(2200, 4500);
  }

  update(dt: number): void {
    const s = gameStore.getState();
    if (s.status !== "playing") return;

    if (s.pendingHerbVisitTrigger && this.visitState === "idle") {
      s.acknowledgeHerbVisit();
      this.startVisit();
      return;
    }

    if (this.visitState === "idle" && this.scene.time.now >= this.nextVisitTimer) {
      this.startVisit();
      return;
    }

    if (this.visitState === "idle") {
      this.updateDining(dt);
    }
  }

  private updateDining(dt: number): void {
    if (this.scene.time.now >= this.nextDirChangeAt) {
      this.scheduleNextDirChange();
    }
    const dx = this.diningTargetX - this.container.x;
    if (Math.abs(dx) > 4) {
      const step = Math.min(HERB_DINING_SPEED * dt, Math.abs(dx));
      this.container.x += Math.sign(dx) * step;
    }
  }

  private startVisit(): void {
    this.visitState = "walking_to_door";
    gameStore.getState().setHerbVisitState("walking_to_kitchen");
    this.scene.tweens.add({
      targets: this.container,
      x: DOOR_X,
      duration: 800,
      ease: "Sine.InOut",
      onComplete: () => this.enterKitchen()
    });
  }

  private enterKitchen(): void {
    this.visitState = "entering_kitchen";
    this.scene.tweens.add({
      targets: this.container,
      y: DOOR_KITCHEN_LURK_Y,
      duration: 700,
      ease: "Sine.InOut",
      onComplete: () => {
        this.visitState = "in_kitchen";
        gameStore.getState().setHerbVisitState("in_kitchen");
        // Wander to a believable kitchen excuse position
        const lingerX = Phaser.Math.Between(280, 520);
        this.scene.tweens.add({
          targets: this.container,
          x: lingerX,
          duration: HERB_VISIT_DURATION_MS - 1400,
          ease: "Sine.InOut",
          onComplete: () => this.exitKitchen()
        });
      }
    });
  }

  private exitKitchen(): void {
    this.visitState = "exiting_kitchen";
    gameStore.getState().setHerbVisitState("returning");
    this.scene.tweens.add({
      targets: this.container,
      x: DOOR_X,
      duration: 700,
      ease: "Sine.InOut",
      onComplete: () => this.leaveDoor()
    });
  }

  private leaveDoor(): void {
    this.visitState = "leaving_door";
    this.scene.tweens.add({
      targets: this.container,
      y: DINING_GROUND_Y,
      duration: 700,
      ease: "Sine.InOut",
      onComplete: () => {
        this.visitState = "idle";
        gameStore.getState().setHerbVisitState("idle");
        this.nextVisitTimer =
          this.scene.time.now +
          Phaser.Math.Between(HERB_VISIT_INTERVAL_MIN, HERB_VISIT_INTERVAL_MAX);
        this.scheduleNextDirChange();
      }
    });
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }
  isInDining(): boolean {
    return this.container.y > 360;
  }
}
