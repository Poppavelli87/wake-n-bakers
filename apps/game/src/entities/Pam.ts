import * as Phaser from "phaser";
import { SAVORYVILLE } from "../palette";

const PAM_SPEED = 80;
const HERB_PROXIMITY_BLUSH = 200;
const DINING_X_MIN = 250;
const DINING_X_MAX = 1000;

/**
 * Pam Stax — brunette waitress, owns Stax Pamcakes (rival food truck).
 * Wanders the dining floor. When Herb is nearby AND in the dining floor,
 * a small heart icon appears above her head. THE CRUSH IS NEVER STATED.
 * The icon is the only mechanical surface; no dialogue, no popup, no
 * internal monologue. Locked design rule.
 */
export class Pam {
  container: Phaser.GameObjects.Container;
  blushIcon: Phaser.GameObjects.Text;
  scene: Phaser.Scene;
  targetX = 400;
  nextDirChangeAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y);

    const dress = scene.add
      .rectangle(0, -25, 44, 70, SAVORYVILLE.pamTeal)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const apronTrim = scene.add.rectangle(0, -8, 44, 6, SAVORYVILLE.bacon500);
    const head = scene.add
      .circle(0, -80, 22, SAVORYVILLE.bacon100)
      .setStrokeStyle(3, SAVORYVILLE.skillet900);
    const hair = scene.add.ellipse(0, -82, 30, 22, SAVORYVILLE.skillet900);
    const spatHandle = scene.add.rectangle(22, -45, 4, 26, SAVORYVILLE.skillet900);
    const spatHead = scene.add
      .rectangle(22, -60, 16, 8, SAVORYVILLE.steam300)
      .setStrokeStyle(2, SAVORYVILLE.skillet900);
    const smile = scene.add.arc(0, -76, 8, 200, 340, false, SAVORYVILLE.skillet900);
    smile.setClosePath(false);
    const label = scene.add
      .text(0, 30, "Pam", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "12px",
        color: "#2b201a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0);

    this.container.add([
      dress,
      apronTrim,
      head,
      hair,
      spatHandle,
      spatHead,
      smile,
      label
    ]);
    this.container.setDepth(14);

    this.blushIcon = scene.add
      .text(x, y - 110, "♡", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "22px",
        color: "#b23a1a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5)
      .setDepth(20)
      .setVisible(false);

    this.scheduleNextDirChange();
  }

  private scheduleNextDirChange(): void {
    this.targetX = Phaser.Math.Between(DINING_X_MIN, DINING_X_MAX);
    this.nextDirChangeAt = this.scene.time.now + Phaser.Math.Between(3000, 5500);
  }

  update(dt: number, herbX: number, herbInDining: boolean): void {
    if (this.scene.time.now >= this.nextDirChangeAt) {
      this.scheduleNextDirChange();
    }
    const dx = this.targetX - this.container.x;
    if (Math.abs(dx) > 4) {
      const step = Math.min(PAM_SPEED * dt, Math.abs(dx));
      this.container.x += Math.sign(dx) * step;
    }

    const distToHerb = Math.abs(this.container.x - herbX);
    const showBlush = herbInDining && distToHerb < HERB_PROXIMITY_BLUSH;
    this.blushIcon.setPosition(this.container.x, this.container.y - 110);
    if (showBlush !== this.blushIcon.visible) {
      this.blushIcon.setVisible(showBlush);
      if (showBlush) {
        this.scene.tweens.add({
          targets: this.blushIcon,
          y: this.container.y - 120,
          alpha: { from: 0.6, to: 1 },
          yoyo: true,
          repeat: -1,
          duration: 700
        });
      } else {
        this.scene.tweens.killTweensOf(this.blushIcon);
        this.blushIcon.setAlpha(1);
      }
    }
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }
}
