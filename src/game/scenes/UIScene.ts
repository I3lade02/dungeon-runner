import Phaser from "phaser";
import type { Upgrade } from "../data/upgrades";

export class UIScene extends Phaser.Scene {
  private hpText!: Phaser.GameObjects.Text;
  private enemyText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;

  private upgradeContainer?: Phaser.GameObjects.Container;

  constructor() {
    super("UIScene");
  }

  create() {
    const gameScene = this.scene.get("GameScene");

    this.hpText = this.add.text(20, 20, "HP: 100", {
      fontSize: "24px",
      color: "#ffffff",
    });

    this.enemyText = this.add.text(20, 52, "Enemies: 0", {
      fontSize: "20px",
      color: "#ffffff",
    });

    this.waveText = this.add.text(20, 84, "Wave: 1", {
      fontSize: "20px",
      color: "#ffffff",
    });


    this.gameOverText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "YOU DIED\nPress SPACE to restart", {
        fontSize: "36px",
        color: "#f87171",
        align: "center",
      })
      .setOrigin(0.5)
      .setVisible(false);

    gameScene.events.on("player-hp-changed", (hp: number) => {
      this.hpText.setText(`HP: ${hp}`);
    });

    gameScene.events.on("enemy-count-changed", (count: number) => {
      this.enemyText.setText(`Enemies: ${count}`);
    });

    gameScene.events.on("wave-changed", (wave: number) => {
      this.waveText.setText(`Wave: ${wave}`);
    });

    gameScene.events.on("game-over", () => {
      this.hideUpgradeSelection();
      this.gameOverText.setVisible(true);
    });

    gameScene.events.on("show-upgrade-selection", (upgrades: Upgrade[]) => {
      this.showUpgradeSelection(upgrades);
    });

    gameScene.events.on("hide-upgrade-selection", () => {
      this.hideUpgradeSelection();
    });
  }

  private showUpgradeSelection(upgrades: Upgrade[]) {
    this.hideUpgradeSelection();

    const gameScene = this.scene.get("GameScene");
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const bg = this.add.rectangle(centerX, centerY, 900, 320, 0x09090b, 0.94);
    bg.setStrokeStyle(2, 0x3f3f46);

    const title = this.add
      .text(centerX, centerY - 110, "Choose an Upgrade", {
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const elements: Phaser.GameObjects.GameObject[] = [bg, title];

    const startX = centerX - 280;
    const gap = 280;

    upgrades.forEach((upgrade, index) => {
      const cardX = startX + index * gap;
      const cardY = centerY + 10;

      const rect = this.add
        .rectangle(cardX, cardY, 220, 180, 0x18181b)
        .setStrokeStyle(2, 0x52525b)
        .setInteractive({ useHandCursor: true });

      const name = this.add
        .text(cardX, cardY - 40, upgrade.title, {
          fontSize: "24px",
          color: "#f8fafc",
          align: "center",
          wordWrap: { width: 180 },
        })
        .setOrigin(0.5);

      const desc = this.add
        .text(cardX, cardY + 20, upgrade.description, {
          fontSize: "18px",
          color: "#cbd5e1",
          align: "center",
          wordWrap: { width: 180 },
        })
        .setOrigin(0.5);

      rect.on("pointerover", () => {
        rect.setFillStyle(0x27272a, 1);
      });

      rect.on("pointerout", () => {
        rect.setFillStyle(0x18181b, 1);
      });

      rect.on("pointerdown", () => {
        gameScene.events.emit("upgrade-selected", upgrade);
      });

      elements.push(rect, name, desc);
    });

    this.upgradeContainer = this.add.container(0, 0, elements);
  }

  private hideUpgradeSelection() {
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy(true);
      this.upgradeContainer = undefined;
    }
  }
}