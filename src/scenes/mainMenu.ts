import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, mapAtom, store } from "../store";
import initCam from "../utils/initCam";
import type { HeroGameObj } from "../types";

export default function levelTransition(k: KAPLAYCtx) {
    k.scene("mainMenu", (hero: HeroGameObj) => {
        initCam(k);
        k.onResize(() => {
            initCam(k);
            store.set(mapAtom, {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                scale: k.getCamScale().x,
            });
        });
        
    });
}