import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, store, startingOptionsAtom } from "../store";
import initCam from "../utils/initCam";
import type { HeroGameObj, MapData, Scene, Upgrade } from "../types";
import type { TowerId } from "../constants";
import generateTowerOptions from "../utils/generateTowerOptions";
import addTowers from "../utils/addTowers";
import generateDeck from "../utils/generateDeck";

export default function mainMenu(k: KAPLAYCtx) {
    k.scene("mainMenu" satisfies Scene, async () => {
        const mapData: MapData = await (await fetch("data/level1.json")).json();

        // Generate tile grid for placement logic
        const tileGrid: boolean[][] = [];
        mapData.layers.find(layer => layer.name === "Ground")?.data?.forEach((tile, index) => {
            const x = index % mapData.width;
            const y = Math.floor(index / mapData.width);
            if (!tileGrid[y]) tileGrid[y] = [];
            tileGrid[y][x] = tile !== 1;
        });

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
            addTowers: (ids) => store.set(gameStateAtom, prev => ({
                ...prev,
                towerButtons: addTowers(k, ids, tileGrid)
            }))
        }));
    });
}