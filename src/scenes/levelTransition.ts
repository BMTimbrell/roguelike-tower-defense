import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, rewardsAtom, store } from "../store";
import initCam from "../utils/initCam";
import type { HeroGameObj, Scene } from "../types";
import { SCENES } from "../constants";
import generateMap from "../utils/generateMap";
import makeHero from "../entities/Hero";

export default function levelTransition(k: KAPLAYCtx) {
    k.scene("levelTransition" satisfies Scene, async (hero: HeroGameObj) => {
        initCam(k);

        k.onResize(() => {
            initCam(k);
        });

        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: "levelTransition",
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

        heroSprite.onAnimEnd(async () => {
            store.set(gameStateAtom, prev => ({
                ...prev,
                scene: "levelTransition",
                sceneIndex: prev.sceneIndex + 1,
                selectedUI: null
            }));

            hero.level++;

            let rand = k.randi();
            const sceneName = SCENES[store.get(gameStateAtom).sceneIndex][rand];

            const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

            store.set(rewardsAtom, prev => ({
                ...prev,
                addSkill: (id) => {
                    hero.skillIds.push(id);
                    const updatedHero = makeHero(
                        k,
                        {
                            heroId: hero.heroId,
                            pos: k.toWorld(k.mousePos()),
                            tileGrid,
                            pathTiles
                        }
                    );

                    updatedHero.skillIds = hero.skillIds;

                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        hero: updatedHero
                    }));

                    store.set(rewardsAtom, prev => ({
                        ...prev,
                        rewardIndex: prev.rewardIndex + 1
                    }));
                },
                visible: true
            }));
        });
    });
}