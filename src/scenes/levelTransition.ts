import type { KAPLAYCtx } from "kaplay";
import { altarAtom, challengesAtom, chestAtom, gameStateAtom, hoveredTotemAtom, rewardsAtom, shopAtom, shopChoiceUIAtom, store, unlockProgressionAtom } from "../store";
import initCam from "../utils/initCam";
import type { HeroGameObj, LevelWaves, Scene, Upgrade } from "../types";
import { BASE_DRAW_COST, LEVEL_REWARDS, LEVEL_WAVES, SCENES, TOWERS, UPGRADES, WORLDS, type LevelId, type TowerId } from "../constants";
import generateMap from "../utils/generateMap";
import makeHero from "../entities/Hero";
import addTowers from "../utils/addTowers";
import updateSkills from "../utils/updateSkills";
import goToNextScene from "../utils/goToNextScene";
import { playUISound } from "../utils/soundHelpers";
import { saveRun } from "../platform/save";
import { completeCampaign, saveMetaProgress } from "../utils/checkUnlocks";

export default function levelTransition(k: KAPLAYCtx) {
    k.scene("levelTransition" satisfies Scene, async (hero: HeroGameObj) => {
        initCam(k);

        k.onResize(() => {
            initCam(k);
        });

        const challengeManager = store.get(gameStateAtom).challengeManager;

        challengeManager.completeIfSurvivedLevel();

        const challenge = challengeManager.getChallenge();
        const reward = challenge?.completed ? challenge.def.reward : 0;

        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: "levelTransition",
            selectedUI: null,
            towerCoins: prev.towerCoins + reward,
            deck: {
                ...prev.deck,
                drawCost: BASE_DRAW_COST
            },
            selectedUpgrade: null
        }));

        store.set(challengesAtom, prev => ({
            ...prev,
            visible: false
        }));

        store.set(chestAtom, prev => ({
            ...prev,
            visible: false
        }));

        store.set(hoveredTotemAtom, null);

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

        if (store.get(gameStateAtom).level >= 6) {
            completeCampaign(1, store.get(gameStateAtom).difficulty);

            k.wait(0.5, async () => {
                k.add([
                    k.pos(k.getCamPos()),
                    k.text("You Win!", {
                        size: 64,
                        font: "free pixel"
                    }),
                    k.anchor("center"),
                    k.scale(1),
                    k.color("#FFFFFF"),
                    k.z(999999),
                ]);

                await saveRun(undefined);

                await saveMetaProgress();

                const buttonPos = k.getCamPos().add(k.vec2(0, 50));

                const mainMenuButton = k.add([
                    k.rect(100, 25, { radius: 2 }),
                    k.pos(buttonPos),
                    k.anchor("center"),
                    k.area(),
                    k.color(85, 85, 85),
                    k.z(1000)
                ]);

                k.add([
                    k.rect(100, 25, { radius: 2, fill: false }),
                    k.pos(buttonPos),
                    k.anchor("center"),
                    k.opacity(0.5),
                    k.z(1001),
                    k.outline(1, k.rgb(255, 255, 255))
                ]);

                k.add([
                    k.text("Main Menu", { size: 16, font: "free pixel" }),
                    k.pos(buttonPos.x, buttonPos.y),
                    k.anchor("center"),
                    k.z(1001)
                ]);

                mainMenuButton.onHover(() => {
                    k.setCursor("pointer");
                    mainMenuButton.color = k.rgb(144, 144, 144); // brighter green
                });

                mainMenuButton.onHoverEnd(() => {
                    k.setCursor("default");
                    mainMenuButton.color = k.rgb(85, 85, 85); // original color
                });

                mainMenuButton.onClick(() => {
                    k.go("mainMenu");
                });
            });

            return;
        }

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
                towerCoins: prev.towerCoins + LEVEL_REWARDS[store.get(gameStateAtom).sceneIndex]
            }));

            hero.level++;

            const { world, sceneIndex, level } = store.get(gameStateAtom);

            const scenes = WORLDS[world - 1].scenes;

            let rand = k.randi(scenes[sceneIndex].length);
            const sceneName = scenes[sceneIndex][rand];

            const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

            rand = level === 6 ? 0 : k.randi();

            const wavePrefix = world > 1 ? `${WORLDS[world - 1].wavePrefix}-` : "";
            const wave = `${wavePrefix}level${level}-${rand + 1}` as LevelId;

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
                            pathTiles,
                            level: hero.level
                        }
                    );

                    updatedHero.skillIds = hero.skillIds;

                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        hero: updatedHero,
                        heroButton: {
                            ...prev.heroButton,
                            onClick: () => {
                                if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                                else k.add(updatedHero);
                            }
                        }
                    }));

                    updateSkills(updatedHero);

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
                        k.text(`+${LEVEL_REWARDS[store.get(gameStateAtom).sceneIndex - 1]}`, {
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

                    if (challenge) {
                        const heading = reward ? "Challenge Complete!" : "Challenge Failed!";

                        const headingText = k.add([
                            k.text(heading, {
                                size: 24,
                                font: "free pixel"
                            }),
                            k.scale(2),
                            k.opacity(1),
                            k.lifespan(2),
                            k.anchor("center"),
                            k.pos(k.center())
                        ]);

                        if (reward) {
                            const coin = k.add([
                                k.sprite("tower coin"),
                                k.scale(2),
                                k.anchor("center"),
                                k.opacity(1),
                                k.lifespan(2),
                                k.pos(headingText.pos.add(0, headingText.height + 30))
                            ]);

                            k.add([
                                k.text(`+${reward}`, {
                                    size: 16,
                                    font: "free pixel"
                                }),
                                k.lifespan(2),
                                k.opacity(1),
                                k.scale(2),
                                k.anchor("center"),
                                k.pos(coin.pos.add(coin.width + 30, 0))
                            ]);

                            playUISound(k, "challenge complete");
                        } else playUISound(k, "challenge failed");

                        challengeManager.setChallenge(null);
                        await k.wait(2);
                    }

                    const level = LEVEL_WAVES[wave] as LevelWaves;

                    // shop
                    if (level.shop) {
                        store.set(shopChoiceUIAtom, prev => ({
                            ...prev,
                            visible: store.get(gameStateAtom).shops.length > 1
                        }));

                        const hero = store.get(gameStateAtom).hero;
                        if (!hero) return;

                        store.set(altarAtom, prev => ({
                            ...prev,
                            visible: store.get(gameStateAtom).shops.length < 2 && store.get(gameStateAtom).shops[0] === "altar",
                            levelUp: () => {
                                store.set(altarAtom, prev => ({
                                    ...prev,
                                    visible: false
                                }));

                                store.set(rewardsAtom, prev => ({
                                    ...prev,
                                    visible: true,
                                    addSkill: (id) => {
                                        hero.skillIds.push(id);
                                        const updatedHero = makeHero(
                                            k,
                                            {
                                                heroId: hero.heroId,
                                                pos: k.toWorld(k.mousePos()),
                                                tileGrid,
                                                pathTiles,
                                                level: hero.level + 1
                                            }
                                        );

                                        updatedHero.skillIds = hero.skillIds;

                                        store.set(gameStateAtom, prev => ({
                                            ...prev,
                                            hero: updatedHero,
                                            heroButton: {
                                                ...prev.heroButton,
                                                heroButton: {
                                                    ...prev.heroButton,
                                                    onClick: () => {
                                                        if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                                                        else k.add(updatedHero);
                                                    }
                                                },
                                            },
                                            heroCharge: {
                                                ...prev.heroCharge,
                                                damageDealt: 0,
                                                charge: 0,
                                                damageRequired: prev.heroCharge.damageRequired * 1.75
                                            }
                                        }));

                                        updateSkills(updatedHero);

                                        store.set(altarAtom, prev => ({
                                            ...prev,
                                            visible: true
                                        }));

                                        store.set(rewardsAtom, prev => ({
                                            ...prev,
                                            visible: false
                                        }));
                                    }
                                }));
                            }
                        }));

                        const ownedTowers = store.get(gameStateAtom).towerButtons.map(t => t.id);
                        const towers = Object.keys(TOWERS).filter(t => !ownedTowers.some(id => id === t) && TOWERS[(t as TowerId)].source === "reward") as TowerId[];

                        function generateRandomIndexes(indexes: Set<number>, arr: (TowerId | Upgrade)[]) {
                            while (indexes.size < 3) {
                                const index = k.randi(arr.length);
                                indexes.add(index);
                            }

                            return indexes;
                        }

                        const towerIndexes = generateRandomIndexes(new Set, towers);

                        const smallUpgrades = [...new Set(UPGRADES.filter(u => u.cost === 1))];
                        const mediumUpgrades = [...new Set(UPGRADES.filter(u => u.cost === 2))];
                        const largeUpgrades = [...new Set(UPGRADES.filter(u => u.cost === 3))];

                        const randomSUIndexes = generateRandomIndexes(new Set, smallUpgrades);
                        const randomMUIndexes = generateRandomIndexes(new Set, mediumUpgrades);
                        const randomLUIndexes = generateRandomIndexes(new Set, largeUpgrades);


                        store.set(shopAtom, prev => ({
                            ...prev,
                            visible: store.get(gameStateAtom).shops.length < 2 && store.get(gameStateAtom).shops[0] === "shop",
                            nextLevel: () => {
                                goToNextScene(k, { mapData, tileGrid, pathTiles, wave, level, sceneName });
                            },
                            addTower: (id) => {
                                store.set(gameStateAtom, prev => ({
                                    ...prev,
                                    towerButtons: [
                                        ...addTowers(k, [...prev.towerButtons.map(tb => tb.id), id], tileGrid, pathTiles)
                                    ]
                                }));
                            },
                            towers: [
                                towers[[...towerIndexes][0]],
                                towers[[...towerIndexes][1]],
                                towers[[...towerIndexes][2]]
                            ],
                            upgrades: [
                                smallUpgrades[[...randomSUIndexes][0]],
                                smallUpgrades[[...randomSUIndexes][1]],
                                smallUpgrades[[...randomSUIndexes][2]],
                                mediumUpgrades[[...randomMUIndexes][0]],
                                mediumUpgrades[[...randomMUIndexes][1]],
                                mediumUpgrades[[...randomMUIndexes][2]],
                                largeUpgrades[[...randomLUIndexes][0]],
                                largeUpgrades[[...randomLUIndexes][1]],
                                largeUpgrades[[...randomLUIndexes][2]]
                            ]
                        }));
                    } else {
                        goToNextScene(k, { mapData, tileGrid, pathTiles, wave, level, sceneName });
                    }
                },
                visible: true
            }));
        });
    });
}