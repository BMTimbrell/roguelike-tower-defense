import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, store } from "../store";

export function waitScaled(k: KAPLAYCtx, duration: number, cb: Function) {
    let t = 0;
    const id = k.onUpdate(() => {
        t += k.dt() * store.get(gameStateAtom).timeScale;
        if (t >= duration) {
            cb();
            id.cancel();
        }
    });
}