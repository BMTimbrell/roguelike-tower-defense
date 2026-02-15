import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, mapAtom, rewardsAtom, store } from "../store";
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

        hero.level++;

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

        k.wait(0.5, () => {
            let zoom = k.getCamScale().x;
            let time = 0;
            const levelUpText = k.add([
                k.pos(k.getCamPos().sub(k.vec2(0, (k.height() / zoom) / 4))),
                k.text("Level Up!", {
                    size: 16,
                    font: "free pixel"
                }),
                {
                    update() {
                        time += k.dt();
                        zoom = k.getCamScale().x;
                        levelUpText.pos = k.getCamPos().sub(k.vec2(0, (k.height() / zoom) / 4)).sub(k.vec2(0, time * 10));
                        levelUpText.wait(0.5, () => {
                            levelUpText.opacity -= k.dt() * 2;
                        });
                    }
                },
                k.lifespan(1.5),
                k.opacity(1),
                k.z(999999),
                k.timer(),
                k.anchor("center"),
                k.color("#FFFFFF")
            ]);
        });

        heroSprite.onAnimEnd(() => {
            store.set(rewardsAtom, prev => ({
                ...prev,
                visible: true
            }));
        });
    });
}