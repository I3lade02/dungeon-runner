import Phaser from "phaser";
import type { UpgradeId } from "../data/upgrades";

export type WeaponStats = {
  fireRate: number;
  bulletSpeed: number;
  bulletDamage: number;
  bulletCount: number;
  spread: number;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  speed = 220;
  hp = 100;

  dashSpeed = 520;
  dashDuration = 120;
  dashCooldown = 1200;
  isDashing = false;
  canDash = true;

  weapon: WeaponStats = {
    fireRate: 180,
    bulletSpeed: 500,
    bulletDamage: 20,
    bulletCount: 1,
    spread: 0.18,
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "__WHITE");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(32, 32);
    this.setTint(0x60a5fa);
    this.setCollideWorldBounds(true);
  }

  move(cursors: { up: boolean; down: boolean; left: boolean; right: boolean }) {
    if (this.isDashing) return;

    let vx = 0;
    let vy = 0;

    if (cursors.left) vx = -1;
    if (cursors.right) vx = 1;
    if (cursors.up) vy = -1;
    if (cursors.down) vy = 1;

    const vec = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.speed);
    this.setVelocity(vec.x, vec.y);
  }

  facePointer(pointer: Phaser.Input.Pointer) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    this.setRotation(angle);
  }

  damagePlayer(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
  }

  tryDash(
    scene: Phaser.Scene,
    cursors: { up: boolean; down: boolean; left: boolean; right: boolean }
  ) {
    if (!this.canDash || this.isDashing) return;
    if (!cursors.up && !cursors.down && !cursors.left && !cursors.right) return;

    const dir = new Phaser.Math.Vector2(
      (cursors.right ? 1 : 0) - (cursors.left ? 1 : 0),
      (cursors.down ? 1 : 0) - (cursors.up ? 1 : 0)
    ).normalize();

    this.isDashing = true;
    this.canDash = false;
    this.setVelocity(dir.x * this.dashSpeed, dir.y * this.dashSpeed);

    scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.setVelocity(0, 0);
    });

    scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  applyUpgrade(id: UpgradeId) {
    switch (id) {
      case "fire-rate":
        this.weapon.fireRate = Math.max(60, this.weapon.fireRate - 25);
        break;
      case "bullet-damage":
        this.weapon.bulletDamage += 8;
        break;
      case "move-speed":
        this.speed += 20;
        break;
      case "bullet-speed":
        this.weapon.bulletSpeed += 80;
        break;
      case "multi-shot":
        this.weapon.bulletCount += 1;
        break;
      case "dash-cooldown":
        this.dashCooldown = Math.max(300, this.dashCooldown - 180);
        break;
    }
  }
}