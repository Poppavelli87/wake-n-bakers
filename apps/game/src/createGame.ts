import * as Phaser from "phaser";
import { KitchenScene } from "./scenes/KitchenScene";
import { SAVORYVILLE } from "./palette";

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: SAVORYVILLE.skillet900,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [KitchenScene]
  });
}
