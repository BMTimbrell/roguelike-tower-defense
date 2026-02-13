import type { KAPLAYCtx } from "kaplay";

export default function initCam(k: KAPLAYCtx): number {
    let zoom = k.width() < 1400 ? 1 : 2;
    k.setCamScale(zoom);

    return zoom;
}