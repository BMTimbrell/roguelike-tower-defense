import type { KAPLAYCtx } from "kaplay";
import { mapAtom, store } from "../store";

export default function initCam(k: KAPLAYCtx): number {
    const zoom = k.width() < 1000 ? 1 : 2;
    k.setCamScale(zoom);

    const fontScale = k.width() < 800 ? 1 : k.width() < 1400 ? 1.5 : 2;

    store.set(mapAtom, prev => ({
        ...prev,
        iconScale: zoom,
        fontScale
    }));

    return zoom;
}