import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom, selectHeroUIAtom } from "../store";
import initCam from "../utils/initCam";
import type { Scene, Upgrade } from "../types";
import { CHARGE_DAMAGE_REQUIRED, type HeroId, type TowerId } from "../constants";
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
                        pathTiles
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
    });
}