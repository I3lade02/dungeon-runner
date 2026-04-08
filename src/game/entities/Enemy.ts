import Phaser from "phaser";
import { Player } from "./Player";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  speed = 90;
  hp = 40;
  touchDamage = 10;
  lastHitTime = 0;
  hitCooldown = 700;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "__WHITE");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(28, 28);
    this.setTint(0xf43f5e);
  }

  chase(player: Player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.scene.physics.velocityFromRotation(
      angle,
      this.speed,
      (this.body as Phaser.Physics.Arcade.Body).velocity
    );
    this.setRotation(angle);
  }

  takeDamage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  canDamagePlayer(now: number) {
    return now - this.lastHitTime >= this.hitCooldown;
  }

  markDamagedPlayer(now: number) {
    this.lastHitTime = now;
  }
}