import type { KAPLAYCtx, Vec2 } from "kaplay";

export default function drawLaser(k: KAPLAYCtx, origin: Vec2, target: Vec2, height: number, lifespan: number) {
    k.add([
        k.sprite("sniper laser", { width: origin.dist(target), height }),
        k.pos(origin),
        k.anchor("left"),
        k.rotate(target.sub(origin).angle()),
        k.lifespan(lifespan),
        k.opacity(1)
    ]);
}