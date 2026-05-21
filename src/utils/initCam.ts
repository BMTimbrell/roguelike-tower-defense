import type { KAPLAYCtx } from "kaplay";
import { mapAtom, store } from "../store";

export default function initCam(k: KAPLAYCtx): number {
    let zoom = k.width() < 1200 ? 1 : 2;
    k.setCamScale(zoom);

    store.set(mapAtom, {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scale: zoom
    });

    return zoom;
}