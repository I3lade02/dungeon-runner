import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  private hasStartedGame = false;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private readonly handlePointerStart = () => {
    this.startGame();
  };

  constructor() {
    super("MenuScene");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x09090b);
    this.add
      .rectangle(centerX, centerY, this.scale.width - 120, this.scale.height - 120, 0x18181b)
      .setStrokeStyle(4, 0x3f3f46);

    this.add
      .text(centerX, centerY - 190, "DUNGEON RUNNER", {
        fontSize: "56px",
        color: "#f8fafc",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 120, "Clear each wave, pick upgrades, and stay alive.", {
        fontSize: "24px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    const controlsTitle = this.add
      .text(centerX, centerY - 25, "Controls", {
        fontSize: "28px",
        color: "#f8fafc",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const controlsBody = this.add
      .text(
        centerX,
        centerY + 55,
        [
          "W A S D  Move",
          "Mouse  Aim",
          "Hold Click  Shoot",
          "Space  Dash",
        ].join("\n"),
        {
          fontSize: "24px",
          color: "#e2e8f0",
          align: "center",
          lineSpacing: 10,
        }
      )
      .setOrigin(0.5);

    const startButton = this.add
      .rectangle(centerX, centerY + 210, 320, 76, 0x2563eb)
      .setStrokeStyle(3, 0x93c5fd)
      .setInteractive({ useHandCursor: true });

    const startLabel = this.add
      .text(centerX, centerY + 210, "Start Game", {
        fontSize: "30px",
        color: "#eff6ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const startHint = this.add
      .text(centerX, centerY + 272, "Press Enter or click the button", {
        fontSize: "20px",
        color: "#94a3b8",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [startButton, startLabel],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    startButton.on("pointerover", () => {
      startButton.setFillStyle(0x1d4ed8, 1);
      startHint.setColor("#cbd5e1");
    });

    startButton.on("pointerout", () => {
      startButton.setFillStyle(0x2563eb, 1);
      startHint.setColor("#94a3b8");
    });

    startButton.on("pointerdown", this.handlePointerStart);

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.enterKey?.on("down", this.startGame, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      startButton.off("pointerdown", this.handlePointerStart);
      this.enterKey?.off("down", this.startGame, this);
    });

    controlsTitle.setDepth(1);
    controlsBody.setDepth(1);
    startButton.setDepth(1);
    startLabel.setDepth(1);
    startHint.setDepth(1);
  }

  private startGame() {
    if (this.hasStartedGame) {
      return;
    }

    this.hasStartedGame = true;
    this.scene.start("GameScene");
    this.scene.launch("UIScene");
  }
}
