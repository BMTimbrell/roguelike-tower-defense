import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom } from "../store";
import initCam from "../utils/initCam";
import type { Scene, Upgrade } from "../types";
import type { TowerId } from "../constants";
import generateTowerOptions from "../utils/generateTowerOptions";
import addTowers from "../utils/addTowers";
import generateDeck from "../utils/generateDeck";
import generateMap from "../utils/generateMap";

export default function mainMenu(k: KAPLAYCtx) {
    k.scene("mainMenu" satisfies Scene, async () => {
        const { mapData, tileGrid, pathTiles } = await generateMap(k, "data/level1.json");

        initCam(k);
        k.onResize(() => {
            initCam(k);
        });

        k.onKeyDown("enter", () => {
            k.go("level1" satisfies Scene, mapData);
            store.set(startingOptionsAtom, prev => ({
                ...prev,
                visible: false
            }));
        });

        const options: { ids: TowerId[]; upgrades: Upgrade[] }[] = [];

        for (let i = 0; i < 3; i++) options.push({ ids: generateTowerOptions(), upgrades: generateDeck(k) });

        store.set(startingOptionsAtom, prev => ({
            ...prev,
            visible: true,
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
                k.go("level1" satisfies Scene, mapData);
                store.set(startingOptionsAtom, prev => ({
                    ...prev,
                    visible: false
                }));
            }
        }));
    });
}