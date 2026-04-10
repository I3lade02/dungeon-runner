import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { getRandomUpgrades, type Upgrade } from "../data/upgrades";

type BulletData = {
  sprite: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  damage: number;
  life: number;
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;

  private bullets: BulletData[] = [];

  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  private canShoot = true;
  private gameOver = false;
  private pausedForUpgrade = false;
  private wave = 1;
  private readonly handleUpgradeSelected = (upgrade: Upgrade) => {
    this.continueToNextWave(upgrade);
  };

  constructor() {
    super("GameScene");
  }

  create() {
    this.gameOver = false;
    this.pausedForUpgrade = false;
    this.wave = 1;
    this.canShoot = true;
    this.bullets = [];

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width - 80,
        this.scale.height - 80,
        0x27272a
      )
      .setStrokeStyle(4, 0x3f3f46);

    this.player = new Player(this, this.scale.width / 2, this.scale.height / 2);

    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: false,
    });

    this.keys = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as typeof this.keys;

    this.initEventBridge();
    this.spawnWave(this.getWaveEnemyCount());

    this.input.on("pointerdown", () => {
      this.tryShoot();
    });

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_playerObj, enemyObj) => {
        if (this.gameOver || this.pausedForUpgrade) return;
        if (this.player.isDashing) return;

        const enemy = enemyObj as Enemy;
        const now = this.time.now;

        if (enemy.canDamagePlayer(now)) {
          enemy.markDamagedPlayer(now);
          this.player.damagePlayer(enemy.touchDamage);
          this.events.emit("player-hp-changed", this.player.hp);

          if (this.player.hp <= 0) {
            this.handleGameOver();
          }
        }
      }
    );

    this.events.emit("player-hp-changed", this.player.hp);
    this.events.emit("enemy-count-changed", this.enemies.countActive(true));
    this.events.emit("wave-changed", this.wave);
  }

  update(_time: number, delta: number) {
    if (this.gameOver || this.pausedForUpgrade) {
      this.player.setVelocity(0, 0);
      return;
    }

    const moveState = {
      up: this.keys.w.isDown,
      down: this.keys.s.isDown,
      left: this.keys.a.isDown,
      right: this.keys.d.isDown,
    };

    this.player.move(moveState);
    this.player.facePointer(this.input.activePointer);

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.player.tryDash(this, moveState);
    }

    const enemies = this.enemies.getChildren() as Enemy[];
    enemies.forEach((enemy) => enemy.chase(this.player));

    if (this.input.activePointer.isDown) {
      this.tryShoot();
    }

    this.updateBullets(delta);

    this.events.emit("enemy-count-changed", this.enemies.countActive(true));
  }

  private tryShoot() {
    if (!this.canShoot || this.gameOver || this.pausedForUpgrade) return;

    this.canShoot = false;

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      this.input.activePointer.worldX,
      this.input.activePointer.worldY
    );

    const { bulletCount, spread, bulletSpeed, bulletDamage, fireRate } = this.player.weapon;
    const offset = 28;

    const fireOneBullet = (angle: number) => {
      const bulletX = this.player.x + Math.cos(angle) * offset;
      const bulletY = this.player.y + Math.sin(angle) * offset;

      const sprite = this.add.rectangle(bulletX, bulletY, 14, 4, 0xf8fafc);
      sprite.setRotation(angle);
      sprite.setDepth(2);

      this.bullets.push({
        sprite,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
        damage: bulletDamage,
        life: 1200,
      });
    };

    if (bulletCount === 1) {
      fireOneBullet(baseAngle);
    } else {
      const startAngle = baseAngle - spread / 2;
      const step = bulletCount > 1 ? spread / (bulletCount - 1) : 0;

      for (let i = 0; i < bulletCount; i++) {
        fireOneBullet(startAngle + step * i);
      }
    }

    this.time.delayedCall(fireRate, () => {
      this.canShoot = true;
    });
  }

  private updateBullets(delta: number) {
    const dt = delta / 1000;
    const enemies = this.enemies.getChildren() as Enemy[];

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      bullet.sprite.x += bullet.vx * dt;
      bullet.sprite.y += bullet.vy * dt;
      bullet.life -= delta;

      let removeBullet = false;

      if (
        bullet.life <= 0 ||
        bullet.sprite.x < -50 ||
        bullet.sprite.x > this.scale.width + 50 ||
        bullet.sprite.y < -50 ||
        bullet.sprite.y > this.scale.height + 50
      ) {
        removeBullet = true;
      }

      if (!removeBullet) {
        for (const enemy of enemies) {
          if (!enemy.active) continue;

          const distance = Phaser.Math.Distance.Between(
            bullet.sprite.x,
            bullet.sprite.y,
            enemy.x,
            enemy.y
          );

          const hitRadius = 18;

          if (distance <= hitRadius) {
            enemy.takeDamage(bullet.damage);
            removeBullet = true;
            break;
          }
        }
      }

      if (removeBullet) {
        bullet.sprite.destroy();
        this.bullets.splice(i, 1);
      }
    }

    if (this.enemies.countActive(true) === 0 && !this.pausedForUpgrade && !this.gameOver) {
      this.openUpgradeSelection();
    }
  }

  private spawnWave(count: number) {
    for (let i = 0; i < count; i++) {
      const pos = this.getSpawnPositionAwayFromPlayer(180);
      const enemy = new Enemy(this, pos.x, pos.y);
      enemy.hp += (this.wave - 1) * 8;
      enemy.speed += (this.wave - 1) * 4;
      this.enemies.add(enemy);
    }

    this.events.emit("enemy-count-changed", this.enemies.countActive(true));
  }

  private getSpawnPositionAwayFromPlayer(minDistance: number) {
    let x = 0;
    let y = 0;
    let distance = 0;

    do {
      x = Phaser.Math.Between(60, this.scale.width - 60);
      y = Phaser.Math.Between(60, this.scale.height - 60);
      distance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
    } while (distance < minDistance);

    return { x, y };
  }

  private getWaveEnemyCount() {
    return 4 + this.wave * 2;
  }

  private openUpgradeSelection() {
    this.pausedForUpgrade = true;
    const upgrades = getRandomUpgrades(3);
    this.events.emit("show-upgrade-selection", upgrades);
  }

  private continueToNextWave(selectedUpgrade: Upgrade) {
    this.player.applyUpgrade(selectedUpgrade.id);
    this.pausedForUpgrade = false;
    this.wave += 1;

    this.clearBullets();

    this.events.emit("wave-changed", this.wave);
    this.events.emit("player-hp-changed", this.player.hp);
    this.events.emit("hide-upgrade-selection");

    this.spawnWave(this.getWaveEnemyCount());
  }

  private clearBullets() {
    for (const bullet of this.bullets) {
      bullet.sprite.destroy();
    }
    this.bullets = [];
  }

  private handleGameOver() {
    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.clearBullets();
    this.events.emit("game-over");

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.restart();
      this.scene.get("UIScene").scene.restart();
    });
  }

  private initEventBridge() {
    this.events.off("upgrade-selected", this.handleUpgradeSelected);
    this.events.on("upgrade-selected", this.handleUpgradeSelected);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  private handleShutdown() {
    this.events.off("upgrade-selected", this.handleUpgradeSelected);
  }
}
