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
    k.loadSprite("slime tower base", "/sprites/slime-tower-base.png");
    k.loadSprite("slime tower", "/sprites/slime-tower.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 3, loop: false, speed: 20 }
        }
    });
    k.loadSprite("ice tower base", "/sprites/ice-tower-base.png");
    k.loadSprite("ice tower", "/sprites/ice-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 20 }
        }
    });
    k.loadSprite("lightning tower base", "/sprites/lightning-tower-base.png");
    k.loadSprite("lightning tower", "/sprites/lightning-tower.png", {
        sliceX: 8,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 7, loop: false, speed: 35 }
        }
    });
    k.loadSprite("lux tower base", "/sprites/lux-tower-base.png");
    k.loadSprite("lux tower", "/sprites/lux-tower.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 1, to: 5, loop: false, speed: 30 }
        }
    });
    k.loadSprite("crow tower base", "/sprites/crow-tower-base.png");
    k.loadSprite("crow tower", "/sprites/crow-tower.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: 0,
            shoot: { from: 0, to: 1, loop: false }
        }
    });
    k.loadSprite("fog", "/sprites/fog5.png");
    k.loadSprite("basic projectile", "/sprites/basic-projectile.png");
    k.loadSprite("slimeball", "/sprites/slimeball.png");
    k.loadSprite("fireball", "/sprites/fireball.png");
    k.loadSprite("light orb", "/sprites/light-orb.png");
    k.loadSprite("crow", "/sprites/crow.png", {
        sliceX: 4,
        sliceY: 1,
        anims: {
            fly: { from: 0, to: 3, loop: true, speed: 5 }
        }
    });
    k.loadSprite("arrow", "/sprites/arrow.png");
    k.loadSprite("flaming arrow", "/sprites/flaming-arrow.png");
    k.loadSprite("archer base", "/sprites/archer-base2.png");
    k.loadSprite("archer", "/sprites/archer2.png", {
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
    k.loadSprite("slime", "/sprites/slime.png", {
        sliceX: 7,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 5, loop: true },
            die: { from: 7, to: 12, loop: false }
        }
    });
    k.loadSprite("skeleton", "/sprites/skeleton.png", {
        sliceX: 5,
        sliceY: 2,
        anims: {
            idle: 0,
            move: { from: 0, to: 3, loop: true, speed: 4 },
            die: { from: 5, to: 9, loop: false }
        }
    });
    k.loadSprite("poison", "/sprites/poison-icon.png");
    k.loadSprite("burn", "/sprites/burn-icon.png");
    k.loadSprite("chill", "/sprites/chill-icon.png");
    k.loadSprite("charge", "/sprites/charge-icon.png");
    k.loadSprite("curse", "/sprites/curse-icon.png");
    k.loadSprite("frost particle", "/sprites/frost-particle.png");
}