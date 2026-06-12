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
import updateSkills from "../utils/updateSkills";

export default function mainMenu(k: KAPLAYCtx) {
    let music: AudioPlay | null = null;

    k.scene("mainMenu" satisfies Scene, async () => {

        k.onClick(async () => {
            if (!music) {
                music = await playMusic(k, "main title");
            }
        });

        let rand = k.randi();
        const sceneName = rand === 1 ? "level1" : "level1-2";
        const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

        initCam(k);
        k.onResize(() => {
            initCam(k);
        });

        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: "mainMenu"
        }));

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

        const saveData = localStorage.getItem("saveData");
        let jsonData = null;
        if (saveData) jsonData = JSON.parse(saveData);

        if (jsonData) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                camMoveAtEdge: jsonData.camMoveAtEdge,
                showDamageNumbers: jsonData.showDamageNumbers
                
            }));
        }
        if (jsonData?.towerButtons) {
            let hero = makeHero(
                k,
                {
                    heroId: jsonData.hero.id,
                    pos: k.toWorld(k.mousePos()),
                    tileGrid: jsonData.tileGrid,
                    pathTiles: jsonData.pathTiles,
                    level: jsonData.hero.level
                }
            );

            hero.skillIds = jsonData.hero.skills;

            updateSkills(hero);

            store.set(gameStateAtom, prev => ({
                ...prev,
                timeScale: 1,
                towerCoins: jsonData.towerCoins,
                sceneIndex: jsonData.sceneIndex,
                level: jsonData.level,
                health: jsonData.health,
                maxHealth: jsonData.maxHealth,
                waveNumber: 0,
                shops: jsonData.shops,
                waveActive: false,
                heroCharge: jsonData.heroCharge,
                deck: {
                    drawCard: () => { },
                    drawCost: 10,
                    cards: jsonData.deck
                },
                selectedUpgrade: null,
                difficulty: jsonData.difficulty,
                challengeManager: new ChallengeManager(),
                nextTowerId: jsonData.nextTowerId,
                towerButtons: addTowers(k, jsonData.towerButtons, jsonData.tileGrid, jsonData.pathTiles),
                hero,
                heroButton: {
                    ...prev.heroButton,
                    onClick: () => {
                        if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                        else k.add(hero);
                    }
                }
            }));
        }

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
                        damageDealt: 0,
                        charge: 0,
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
                        drawCard: () => { },
                        drawCost: 10,
                        cards: upgrades
                    },
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
                    selectedUpgrade: null
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