import type { AudioPlay, KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom, selectHeroUIAtom, shopChoiceUIAtom, shopAtom, altarAtom, mainMenuAtom, gameSpeedUIAtom, challengesAtom } from "../store";
import initCam from "../utils/initCam";
import type { Scene, Upgrade } from "../types";
import { CHARGE_DAMAGE_REQUIRED, EXPERT_PLAYER_HEALTH, HARD_PLAYER_HEATLH, NORMAL_PLAYER_HEATLH, type HeroId, type TowerId } from "../constants";
import generateTowerOptions from "../utils/generateTowerOptions";
import addTowers from "../utils/addTowers";
import generateDeck from "../utils/generateDeck";
import generateMap from "../utils/generateMap";
import makeHero from "../entities/Hero";
import { playMusic } from "../utils/soundHelpers";
import { ChallengeManager } from "../utils/challengeHelpers";
import { getSave } from "../platform/save";

export default function mainMenu(k: KAPLAYCtx) {
    let music: AudioPlay | null = null;

    k.scene("mainMenu" satisfies Scene, async () => {

        if (!music) {
            playMusic(k, "main title").then(m => {
                music = m;
            });
        }

        let rand = k.randi();
        const sceneName = rand === 1 ? "level1" : "level1-2";
        const { mapData, tileGrid, pathTiles } = await generateMap(k, `data/${sceneName}.json`);

        initCam(k);
        k.onResize(() => {
            initCam(k);
        });

        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: "mainMenu",
            gameOver: false
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

        const saveData = await getSave();

        if (saveData?.settings) {
            const settings = saveData.settings;

            store.set(gameStateAtom, prev => ({
                ...prev,
                camMoveAtEdge: settings.camMoveAtEdge,
                showDamageNumbers: settings.showDamageNumbers
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
                            else {
                                store.set(gameStateAtom, prev => ({
                                    ...prev,
                                    selectedUpgrade: null
                                }));
                                k.add(hero);
                            }
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
                const difficulty = store.get(gameStateAtom).difficulty;
                const playerHealth = difficulty === "normal" ? NORMAL_PLAYER_HEATLH : difficulty === "hard" ? HARD_PLAYER_HEATLH : EXPERT_PLAYER_HEALTH;

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
                    luck: 1,
                    health: playerHealth,
                    maxHealth: playerHealth,
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