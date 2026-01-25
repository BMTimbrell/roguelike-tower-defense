import type { KAPLAYCtx, Vec2 } from "kaplay";

export default function screenPos(k: KAPLAYCtx, pos: Vec2): Vec2 {
    return k.getCamPos().add(-k.width() / 2 / k.getCamScale().x + pos.x, -k.height() / 2 / k.getCamScale().y + pos.y);
}