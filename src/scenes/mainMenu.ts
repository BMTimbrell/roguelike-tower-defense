import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom, selectHeroUIAtom, shopChoiceUIAtom, shopAtom, altarAtom } from "../store";
import initCam from "../utils/initCam";
import type { Scene, Upgrade } from "../types";
import { CHARGE_DAMAGE_REQUIRED, TOWERS, UPGRADES, type HeroId, type TowerId } from "../constants";
import generateTowerOptions from "../utils/generateTowerOptions";
import addTowers from "../utils/addTowers";
import generateDeck from "../utils/generateDeck";
import generateMap from "../utils/generateMap";
import makeHero from "../entities/Hero";

export default function mainMenu(k: KAPLAYCtx) {
    k.scene("mainMenu" satisfies Scene, async () => {
        let rand = k.randi();
        const sceneName = rand === 1 ? "level1" : "level1-2";
        const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

        initCam(k);
        k.onResize(() => {
            initCam(k);
        });

        store.set(selectHeroUIAtom, prev => ({
            ...prev,
            visible: true,
            addHero: (id: HeroId) => {
                const hero = makeHero(
                    k,
                    {
                        heroId: id,
                        pos: k.toWorld(k.mousePos()),
                        tileGrid,
                        pathTiles,
                        level: 1
                    }
                );

                store.set(gameStateAtom, prev => ({
                    ...prev,
                    heroButton: {
                        ...prev.heroButton,
                        onClick: () => {
                            k.add(hero);
                            store.set(gameStateAtom, prev => ({
                                ...prev,
                                heroButton: {
                                    ...prev.heroButton,
                                    visible: false
                                }
                            }))
                        }
                    },
                    hero,
                    heroCharge: {
                        ...prev.heroCharge,
                        damageRequired: CHARGE_DAMAGE_REQUIRED
                    }
                }));

                store.set(selectHeroUIAtom, prev => ({
                    ...prev,
                    visible: false
                }));

                store.set(startingOptionsAtom, prev => ({
                    ...prev,
                    visible: true
                }))
            }
        }));

        const options: { ids: TowerId[]; upgrades: Upgrade[] }[] = [];

        for (let i = 0; i < 3; i++) options.push({ ids: generateTowerOptions(), upgrades: generateDeck(k) });

        rand = k.randi();
        const waveId = rand === 1 ? "level1-1" : "level1-2";

        store.set(startingOptionsAtom, prev => ({
            ...prev,
            options,
            addLoadout: (ids, upgrades) => {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    towerButtons: addTowers(k, ids, tileGrid, pathTiles),
                    deck: {
                        ...prev.deck,
                        cards: upgrades
                    }
                }));
                k.go(sceneName satisfies Scene, { mapData, tileGrid, pathTiles, wave: waveId });
                store.set(startingOptionsAtom, prev => ({
                    ...prev,
                    visible: false
                }));
            }
        }));

        store.set(shopChoiceUIAtom, prev => ({
            ...prev,
            buttons: [
                {
                    name: "Shop",
                    text: "Go to Shop",
                    description: "Buy towers and upgrade cards.",
                    onClick: () => {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            shops: ["altar"]
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
                            visible: true,
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

                        store.set(shopChoiceUIAtom, prev => ({
                            ...prev,
                            visible: false
                        }));
                    }
                },
                {
                    name: "Altar",
                    text: "Go to Altar",
                    description: "Make offerings to recover HP, increase max HP, and cleanse your deck of unwanted cards.",
                    onClick: () => {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            shops: ["shop"]
                        }));
                        store.set(shopChoiceUIAtom, prev => ({
                            ...prev,
                            visible: false
                        }));
                        store.set(altarAtom, prev => ({
                            ...prev,
                            visible: true
                        }));
                    }
                }
            ]
        }));
    });
}