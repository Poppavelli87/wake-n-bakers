import * as Phaser from "phaser";
import { HelloSavoryvilleScene } from "./scenes/HelloSavoryville";
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
    physics: {
      default: "matter",
      matter: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [HelloSavoryvilleScene]
  });
}
