import type { KAPLAYCtx } from "kaplay";

export default function loadAssets(k: KAPLAYCtx) {
    k.loadSprite("level1", "/sprites/level1.png");
    k.loadSprite("gold", "/sprites/coin.png");
    k.loadSprite("heart", "/sprites/heart.png");
    k.loadSprite("basic tower", "/sprites/basic-tower.png");
    k.loadSprite("basic tower base", "/sprites/basic-tower-base.png");
    k.loadSprite("fire tower", "/sprites/fire-tower.png");
    k.loadSprite("fire tower base", "/sprites/fire-tower-base.png");
    k.loadSprite("fog", "/sprites/fog5.png");
}