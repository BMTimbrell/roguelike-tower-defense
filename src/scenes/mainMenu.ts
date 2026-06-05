import type { AudioPlay, KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom, selectHeroUIAtom, shopChoiceUIAtom, shopAtom, altarAtom, mainMenuAtom, gameSpeedUIAtom, challengesAtom } from "../store";
import initCam from "../utils/initCam";
import type { Scene, Upgrade } from "../types";
import { CHARGE_DAMAGE_REQUIRED, type HeroId, type TowerId } from "../constants";
import generateTowerOptions from "../utils/generateTowerOptions";
import addTowers from "../utils/addTowers";
import generateDeck from "../utils/generateDeck";
import generateMap from "../utils/generateMap";
import makeHero from "../entities/Hero";
import { playMusic } from "../utils/soundHelpers";
import { ChallengeManager } from "../utils/challengeHelpers";

export default function mainMenu(k: KAPLAYCtx) {
    let music: AudioPlay | null = null;

    k.scene("mainMenu" satisfies Scene, async () => {

        k.onClick(async () => {
            if (!music) {
                music = await playMusic(k, "main title");
            }
        });

        let rand = k.randi();
        const sceneName = rand === 1 ? "level1" : "level1";
        const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

        initCam(k);
        k.onResize(() => {
            initCam(k);
        });

        store.set(gameSpeedUIAtom, prev => ({
            ...prev,
            visible: false,
            activeIndex: 0
        }));

        store.set(challengesAtom, prev => ({
            ...prev,
            visible: false
        }));

        store.set(mainMenuAtom, prev => ({
            ...prev,
            visible: true
        }));

        store.set(gameStateAtom, prev => ({
            ...prev,
            timeScale: 1,
            scene: "mainMenu",
            towerCoins: 0,
            challengeManager: new ChallengeManager(),
            sceneIndex: 0,
            level: 1,
            health: 15,
            maxHealth: 15,
            waveNumber: 0,
            shops: ["shop", "altar"],
            heroCharge: {
                charge: 0,
                damageDealt: 0,
                damageRequired: 0
            },
            deck: {
                cards: [],
                drawCard: () => { },
                drawCost: 10
            }
        }));

        store.set(altarAtom, prev => ({
            ...prev,
            visible: false,
            remainingUses: {
                maxHP: 3,
                removeCard: 3,
                levelUp: 1
            },
        }));

        store.set(selectHeroUIAtom, prev => ({
                ...prev,
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
                                if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                                else k.add(hero);
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
        const waveId = rand === 1 ? "level1-1" : "level1-1";

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
                store.set(startingOptionsAtom, prev => ({
                    ...prev,
                    visible: false
                }));
                k.go(sceneName satisfies Scene, { mapData, tileGrid, pathTiles, wave: waveId });
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

                        store.set(shopAtom, prev => ({
                            ...prev,
                            visible: true
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