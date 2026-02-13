import type { KAPLAYCtx } from "kaplay";

export default function loadAssets(k: KAPLAYCtx) {
    k.loadSprite("level1", "/sprites/level1.png");
    k.loadSprite("gold", "/sprites/coin.png");
    k.loadSprite("heart", "/sprites/heart.png");
    k.loadSprite("basic tower", "/sprites/basic-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("basic tower base", "/sprites/basic-tower-base.png");
    k.loadSprite("fire tower", "/sprites/fire-tower.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false, speed: 20 }
        }
    });
    k.loadSprite("fire tower base", "/sprites/fire-tower-base.png");
    k.loadSprite("fog", "/sprites/fog5.png");
    k.loadSprite("basic projectile", "/sprites/basic-projectile.png");
    k.loadSprite("fireball", "/sprites/fireball.png");
    k.loadSprite("arrow", "/sprites/arrow.png");
    k.loadSprite("flaming arrow", "/sprites/flaming-arrow.png");
    k.loadSprite("archer base", "/sprites/archer-base.png");
    k.loadSprite("archer", "/sprites/archer.png", {
        sliceX: 5,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 4, loop: false, speed: 20 }
        }
    });
    k.loadSprite("archer celebrating", "/sprites/archer-celebrating.png", {
        sliceX: 30,
        sliceY: 1,
        anims: {
            celebrate: { from: 0, to: 29, loop: false }
        }
    });
}