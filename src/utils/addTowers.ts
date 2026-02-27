import type { KAPLAYCtx } from "kaplay";
import type { PathTile, Tile, TowerButton, TowerGameObj } from "../types";
import { TOWERS, type TowerId } from "../constants";
import makeTower from "../entities/Tower";
import { gameStateAtom, store } from "../store";

export default function addTowers(k: KAPLAYCtx, towers: TowerId[], tileGrid: Tile[][], pathTiles: PathTile[]): TowerButton[] {
    return towers.map(t => ({
        ...TOWERS[t],
        onClick: () => {
            if (k.get("hero")[0] && !k.get("hero")[0].placed) return;
            const unplacedTower = (k.get("tower") as TowerGameObj[]).find(t => !t.placed);
            if (!unplacedTower || unplacedTower.towerId !== t) {
                makeTower(
                    k,
                    {
                        towerId: t,
                        pos: k.toWorld(k.mousePos()),
                        tileGrid,
                        pathTiles
                    }
                );
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    nextTowerId: prev.nextTowerId + 1,
                    selectedTower: null,
                }));
            }
            if (unplacedTower) {
                k.destroy(unplacedTower);
            }

        },
    }));
}