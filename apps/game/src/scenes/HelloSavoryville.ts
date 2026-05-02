import * as Phaser from "phaser";
import { SAVORYVILLE } from "../palette";

/**
 * Sprint 1 placeholder — the dollhouse cutaway frame.
 * Top half: kitchen (top-down). Bottom half: dining floor (side-scroll).
 * Connected by the pass-through window. Real art lands in Sprint 2.
 */
export class HelloSavoryvilleScene extends Phaser.Scene {
  constructor() {
    super({ key: "HelloSavoryville" });
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const KITCHEN_H = H * 0.5;
    const FLOOR_Y = KITCHEN_H;

    // === Backdrops ===
    this.add.rectangle(0, 0, W, KITCHEN_H, SAVORYVILLE.steam300).setOrigin(0, 0);
    this.add.rectangle(0, FLOOR_Y, W, H - KITCHEN_H, SAVORYVILLE.linen300).setOrigin(0, 0);

    // Kitchen tile pattern hint
    for (let x = 0; x < W; x += 80) {
      this.add.line(0, 0, x, 0, x, KITCHEN_H, SAVORYVILLE.steam500, 0.15);
    }
    for (let y = 0; y < KITCHEN_H; y += 80) {
      this.add.line(0, 0, 0, y, W, y, SAVORYVILLE.steam500, 0.15);
    }

    // Dining floor — wood plank lines
    for (let x = 0; x < W; x += 120) {
      this.add.line(0, 0, x, FLOOR_Y, x, H, SAVORYVILLE.skillet500, 0.2);
    }

    // Heavy dividing line — the dollhouse cutaway
    this.add.rectangle(0, FLOOR_Y - 2, W, 4, SAVORYVILLE.skillet900).setOrigin(0, 0);

    // === Pass-through window ===
    const passW = 220;
    const passH = 56;
    this.add
      .rectangle(W / 2, FLOOR_Y, passW, passH, SAVORYVILLE.butter300)
      .setStrokeStyle(4, SAVORYVILLE.skillet900);
    this.add
      .text(W / 2, FLOOR_Y, "PASS", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "20px",
        color: "#2b201a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);

    // === Title ===
    this.add
      .text(W / 2, 80, "Hello, Savoryville", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "56px",
        color: "#b23a1a",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(W / 2, 130, "Sprint 1 — kitchen warming up", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "18px",
        color: "#4a3528"
      })
      .setOrigin(0.5, 0.5);

    // === Top-down kitchen — Chris + Hamlet ===
    // Chris: chef hat blob (placeholder)
    const chrisX = W * 0.32;
    const chrisY = KITCHEN_H * 0.55;
    const chrisHat = this.add.circle(chrisX, chrisY - 18, 14, SAVORYVILLE.linen100).setStrokeStyle(3, SAVORYVILLE.skillet900);
    const chrisBody = this.add.circle(chrisX, chrisY, 22, SAVORYVILLE.butter500).setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add.text(chrisX, chrisY + 40, "Chris", {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "14px",
      color: "#2b201a",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);

    // Cooking station — bacon on a pan
    const panX = chrisX + 90;
    const panY = chrisY;
    this.add.circle(panX, panY, 24, SAVORYVILLE.skillet700).setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add.rectangle(panX + 36, panY, 30, 6, SAVORYVILLE.skillet900); // pan handle
    const bacon = this.add.rectangle(panX, panY, 28, 8, SAVORYVILLE.bacon500);
    bacon.setStrokeStyle(1, SAVORYVILLE.bacon900);

    // Hamlet: lurking pig
    const hamletX = W * 0.72;
    const hamletY = KITCHEN_H * 0.62;
    this.add.circle(hamletX, hamletY, 26, SAVORYVILLE.hamletPink).setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add.circle(hamletX - 7, hamletY - 6, 3, SAVORYVILLE.skillet900); // eye
    this.add.circle(hamletX + 7, hamletY - 6, 3, SAVORYVILLE.skillet900); // eye
    this.add.ellipse(hamletX, hamletY + 4, 14, 8, 0xd98aa3).setStrokeStyle(2, SAVORYVILLE.skillet900); // snout
    this.add.text(hamletX, hamletY + 50, "Hamlet", {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "14px",
      color: "#2b201a",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);

    // === Side-scroll dining floor — Herb + Patron ===
    const groundY = H - 60;
    this.add.rectangle(0, groundY, W, 4, SAVORYVILLE.skillet900).setOrigin(0, 0);

    // Herb — burly, side-on
    const herbX = W * 0.28;
    const herbHat = this.add.rectangle(herbX, groundY - 90, 40, 28, SAVORYVILLE.linen100).setStrokeStyle(3, SAVORYVILLE.skillet900);
    const herbBody = this.add.rectangle(herbX, groundY - 50, 50, 70, SAVORYVILLE.butter500).setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add.circle(herbX, groundY - 95, 22, SAVORYVILLE.bacon100).setStrokeStyle(3, SAVORYVILLE.skillet900); // face
    this.add.arc(herbX, groundY - 95, 12, 200, 340, false, SAVORYVILLE.skillet900).setClosePath(false); // perma-grin
    this.add.text(herbX, groundY + 15, "Herb (oblivious)", {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "14px",
      color: "#2b201a",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);

    // Patron — booth seat
    const patronX = W * 0.7;
    this.add.rectangle(patronX, groundY - 35, 90, 70, SAVORYVILLE.bacon700).setStrokeStyle(3, SAVORYVILLE.skillet900); // booth back
    this.add.circle(patronX, groundY - 60, 18, SAVORYVILLE.linen300).setStrokeStyle(3, SAVORYVILLE.skillet900);
    this.add.text(patronX, groundY + 15, "Patron", {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "14px",
      color: "#2b201a"
    }).setOrigin(0.5, 0.5);

    // Quip bubble — placeholder for the Quip Wheel
    const bubble = this.add.graphics();
    bubble.fillStyle(SAVORYVILLE.linen100, 1);
    bubble.lineStyle(3, SAVORYVILLE.skillet900, 1);
    bubble.fillRoundedRect(herbX + 50, groundY - 130, 220, 50, 12);
    bubble.strokeRoundedRect(herbX + 50, groundY - 130, 220, 50, 12);
    this.add.text(herbX + 60, groundY - 115, '"Lovely day for a shift."', {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "16px",
      color: "#2b201a"
    });

    // === Hospitality dashboard corner — kitsch teaser ===
    const dashW = 220;
    const dashH = 56;
    const dashX = W - dashW - 16;
    const dashY = 16;
    this.add.rectangle(dashX, dashY, dashW, dashH, SAVORYVILLE.bacon900).setOrigin(0, 0);
    this.add.rectangle(dashX + 4, dashY + 4, dashW - 8, dashH - 8, 0x2eb7b7).setOrigin(0, 0); // dash teal
    this.add.text(dashX + 12, dashY + 8, "HOSPITALITY", {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "11px",
      color: "#fbf3e3",
      fontStyle: "bold"
    });
    this.add.text(dashX + 12, dashY + 24, "★★★★★ 5.0", {
      fontFamily: "Fredoka, sans-serif",
      fontSize: "20px",
      color: "#fbf3e3",
      fontStyle: "bold"
    });
    this.add.circle(dashX + dashW - 22, dashY + 28, 14, SAVORYVILLE.butter500).setStrokeStyle(2, 0xfbf3e3); // thumbs-up mascot blob

    // === Squash & stretch on Chris — life on the line ===
    this.tweens.add({
      targets: [chrisBody, chrisHat],
      scaleY: 0.92,
      scaleX: 1.06,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: "Sine.InOut"
    });

    // === Bacon sizzle ===
    this.tweens.add({
      targets: bacon,
      alpha: { from: 0.7, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 280,
      ease: "Sine.InOut"
    });

    // === Footer note ===
    this.add
      .text(W / 2, H - 10, "Press Esc to leave the kitchen", {
        fontFamily: "Fredoka, sans-serif",
        fontSize: "12px",
        color: "#4a3528"
      })
      .setOrigin(0.5, 1);

    this.input.keyboard?.on("keydown-ESC", () => {
      window.location.href = "/";
    });
  }
}
