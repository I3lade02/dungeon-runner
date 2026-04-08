import Phaser from "phaser";

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    damage: number;
    lifetime: 1200;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        speed: number,
        damage: number
    ) {
        super(scene, x, y, "__WHITE");

        this.damage = damage;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setActive(true);
        this.setVisible(true);
        this.setDisplaySize(10, 10);
        this.setTint(0xf8fafc);
        this.setRotation(angle);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        body.setEnable(true);

        //tiny hitbox so it feels like a shot, not a box trap
        body.setSize(10, 10, true);

        //auto-cleanup
        scene.time.delayedCall(this.lifetime, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }
}