import type { KAPLAYCtx } from "kaplay";

export default function getCamViewRect(k: KAPLAYCtx) {
    const zoom = k.getCamScale().x;
    const cam = k.getCamPos();
    const halfW = (k.width() / zoom) / 2;
    const halfH = (k.height() / zoom) / 2;

    return {
        left: cam.x - halfW,
        right: cam.x + halfW,
        top: cam.y - halfH,
        bottom: cam.y + halfH,
    };
}