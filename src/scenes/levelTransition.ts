import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, mapAtom, store } from "../store";
import initCam from "../utils/initCam";
import type { HeroGameObj } from "../types";

export default function levelTransition(k: KAPLAYCtx) {
    k.scene("levelTransition", (hero: HeroGameObj) => {
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
        store.set(gameStateAtom, prev => ({
            ...prev,
            bottomBarVisible: false,
            selectedUI: null
        }));

        const heroSprite = k.add([
            k.sprite(`${hero.heroId} celebrating`, { anim: "celebrate" }),
            k.scale(4),
            k.pos(k.getCamPos()),
            k.anchor("center"),
            {
                update() {
                    heroSprite.pos = k.getCamPos();
                }
            }
        ]);
    });
}