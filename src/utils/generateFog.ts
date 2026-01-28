import type { KAPLAYCtx } from "kaplay";
import { FOG_Z } from "../constants";

export default function generateFog(k: KAPLAYCtx, mapWorldWidth: number, mapWorldHeight: number) {
    const mapMask = k.add([
        k.pos(0, 0),
        k.rect(mapWorldWidth, mapWorldHeight),
        k.z(FOG_Z),
        k.mask("subtract")
    ]);
    const fogOverlay = mapMask.add([
        k.sprite("fog", { width: k.width(), height: k.height() }),
        k.opacity(0.85),
        k.z(FOG_Z),
        k.fixed()
    ]);

    k.onResize(() => {
        fogOverlay.width = k.width();
        fogOverlay.height = k.height();
    });
}