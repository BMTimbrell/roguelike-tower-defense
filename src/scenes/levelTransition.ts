import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, rewardsAtom, shopAtom, shopChoiceUIAtom, store } from "../store";
import initCam from "../utils/initCam";
import type { HeroGameObj, Scene } from "../types";
import { ENEMIES, LEVEL_WAVES, SCENES } from "../constants";
import generateMap from "../utils/generateMap";
import makeHero from "../entities/Hero";
import addTowers from "../utils/addTowers";

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
                k.pos(k.getCamPos().sub(k.vec2(0, (k.height() / zoom) / 4)).add(k.vec2(hero.levelUpOffset.x, hero.levelUpOffset.y))),
                k.text("Level Up!", {
                    size: 16,
                    font: "free pixel"
                }),
                {
                    update() {
                        time += k.dt();
                        zoom = k.getCamScale().x;
                        levelUpText.pos = k.getCamPos().sub(k.vec2(0, (k.height() / zoom) / 4)).
                            add(k.vec2(hero.levelUpOffset.x, hero.levelUpOffset.y)).
                            sub(k.vec2(0, time * 10));
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
                level: prev.level + 1,
                selectedUI: null,
                heroCharge: {
                    ...prev.heroCharge,
                    damageDealt: 0,
                    charge: 0,
                    damageRequired: prev.heroCharge.damageRequired * 1.75
                },
                towerCoins: prev.towerCoins + 25
            }));

            hero.level++;

            let rand = k.randi(SCENES[store.get(gameStateAtom).sceneIndex].length);
            const sceneName = SCENES[store.get(gameStateAtom).sceneIndex][rand];

            const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

            rand = k.randi();

            const wave = `level${store.get(gameStateAtom).level}-${rand + 1}`;

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
                        hero: updatedHero,
                        heroButton: {
                            ...prev.heroButton,
                            onClick: () => {
                                k.add(updatedHero);
                                store.set(gameStateAtom, prev => ({
                                    ...prev,
                                    heroButton: {
                                        ...prev.heroButton,
                                        visible: false
                                    }
                                }))
                            }
                        },
                    }));

                    store.set(rewardsAtom, prev => ({
                        ...prev,
                        rewardIndex: prev.rewardIndex + 1
                    }));
                },
                addTower: async (id) => {
                    k.destroy(heroSprite);

                    store.set(rewardsAtom, prev => ({
                        ...prev,
                        visible: false,
                        rewardIndex: 0
                    }));

                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        towerButtons: [
                            ...addTowers(k, [...prev.towerButtons.map(tb => tb.id), id], tileGrid, pathTiles)
                        ]
                    }));

                    const coin = k.add([
                        k.sprite("tower coin"),
                        k.scale(2),
                        k.lifespan(1),
                        k.opacity(1),
                        k.anchor("center"),
                        {
                            update() {
                                coin.opacity -= k.dt() * 1.1;
                            }
                        },
                        k.pos(k.center())
                    ]);

                    const text = k.add([
                        k.text("+25", {
                            size: 16,
                            font: "free pixel"
                        }),
                        k.lifespan(1),
                        k.opacity(1),
                        k.scale(2),
                        k.anchor("center"),
                        {
                            update() {
                                text.opacity -= k.dt() * 1.1;
                            }
                        },
                        k.pos(k.center().add(coin.width + 30, 0))
                    ]);

                    await k.wait(1);

                    if (wave === "level3-1" || wave === "level3-2") {
                        const bossId = LEVEL_WAVES[wave].boss.id;
                        const sprite = ENEMIES[bossId].sprite;

                        const bossSprite = k.add([
                            k.sprite(sprite, { anim: "move" }),
                            k.pos(k.center()),
                            k.scale(4),
                            k.anchor("center")
                        ]);

                        bossSprite.pos = bossSprite.pos.add(0, bossSprite.height / 2);

                        k.add([
                            k.text(sprite.toUpperCase(), {
                                size: 16,
                                font: "free pixel"
                            }),
                            k.anchor("center"),
                            k.scale(4),
                            k.pos(k.center().sub(0, bossSprite.height / 2))
                        ]);

                        k.wait(1, () => {
                            k.go(sceneName, { mapData, tileGrid, pathTiles, wave });
                        });
                    } else if (wave === "level2-1" || wave === "level2-2") {
                        store.set(shopChoiceUIAtom, prev => ({
                            ...prev,
                            visible: true
                        }));

                        store.set(shopAtom, prev => ({
                            ...prev,
                            nextLevel: () => {
                                k.go(sceneName, { mapData, tileGrid, pathTiles, wave });
                            },
                            addTower: (id) => {
                                store.set(gameStateAtom, prev => ({
                                    ...prev,
                                    towerButtons: [
                                        ...addTowers(k, [...prev.towerButtons.map(tb => tb.id), id], tileGrid, pathTiles)
                                    ]
                                }));
                            }
                        }));
                    } else {
                        k.go(sceneName, { mapData, tileGrid, pathTiles, wave });
                    }
                },
                visible: true
            }));
        });
    });
}