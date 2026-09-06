import type { AudioPlay, KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom, selectHeroUIAtom, shopChoiceUIAtom, shopAtom, altarAtom, mainMenuAtom, gameSpeedUIAtom, challengesAtom, chestAtom, unlockProgressionAtom } from "../store";
import initCam from "../utils/initCam";
import type { MapData, PathTile, Scene, Tile, Upgrade } from "../types";
import { CHARGE_DAMAGE_REQUIRED, EXPERT_PLAYER_HEALTH, HARD_PLAYER_HEATLH, NORMAL_PLAYER_HEATLH, WORLDS, type HeroId, type LevelId, type TowerId } from "../constants";
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

        initCam(k);
        k.onResize(() => {
            initCam(k);
        });

        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: "mainMenu",
            selectedUI: null,
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

        store.set(chestAtom, prev => ({
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

        if (saveData?.meta) {
            const meta = saveData.meta;
            
            store.set(unlockProgressionAtom, prev => ({
                ...prev,
                unlockedHeroes: meta.unlockedHeroes,
                campaignLevelsCompleted: meta.campaignLevelsCompleted,
                spellsCast: meta.spellsCast,
                levelsWithoutLivesLost: meta.levelsWithoutLivesLost,
                bossesKilled: meta.bossesKilled,
                chestsOpened: meta.chestsOpened,
                enemiesPoisoned: meta.enemiesPoisoned,
                completedCampaigns: meta.completedCampaigns
            }));
        }

        store.set(altarAtom, prev => ({
            ...prev,
            visible: false,
            remainingUses: {
                maxHP: 3,
                removeCard: 5,
                levelUp: 1
            },
        }));

        let sceneName: Scene | undefined;
        let mapData: MapData | undefined;
        let tileGrid: Tile[][] | undefined;
        let pathTiles: PathTile[] | undefined;

        store.set(selectHeroUIAtom, prev => ({
            ...prev,
            addHero: async (id: HeroId) => {
                const world = store.get(gameStateAtom).world;
                sceneName = rand === 1 ? WORLDS[world - 1].scenes[0][rand] : WORLDS[world - 1].scenes[0][rand];
                const map = await generateMap(k, `data/${sceneName}.json`);
                mapData = map.mapData;
                tileGrid = map.tileGrid;
                pathTiles = map.pathTiles;

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

        store.set(startingOptionsAtom, prev => ({
            ...prev,
            options,
            addLoadout: (ids, upgrades) => {
                if (tileGrid && pathTiles && mapData && sceneName) {
                    const grid = tileGrid;
                    const path = pathTiles;
                    rand = k.randi();
                    const world = store.get(gameStateAtom).world;
                    const wavePrefix = world > 1 ? `${WORLDS[world - 1].wavePrefix}-` : "";
                    const waveId = `${wavePrefix}level${1}-${rand + 1}` as LevelId;
                    const difficulty = store.get(gameStateAtom).difficulty;
                    const playerHealth = difficulty === "normal" ? NORMAL_PLAYER_HEATLH : difficulty === "hard" ? HARD_PLAYER_HEATLH : EXPERT_PLAYER_HEALTH;
    
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        towerButtons: addTowers(k, ids, grid, path),
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