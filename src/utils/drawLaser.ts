import type { KAPLAYCtx, Vec2 } from "kaplay";
import { lifespan } from "../kaplayComponents/lifespan";

export default function drawLaser(k: KAPLAYCtx, origin: Vec2, target: Vec2, height: number, duration: number) {
    k.add([
        k.sprite("sniper laser", { width: origin.dist(target), height }),
        k.pos(origin),
        k.anchor("left"),
        k.rotate(target.sub(origin).angle()),
        lifespan(k, duration),
        k.opacity(1)
    ]);
}

export function renderLaser(
    k: KAPLAYCtx,
    origin: Vec2,
    target: Vec2,
    height: number
) {
    k.drawSprite({
        sprite: "solar lance",
        pos: origin,
        anchor: "left",
        width: origin.dist(target),
        height,
        angle: target.sub(origin).angle(),
    });
}