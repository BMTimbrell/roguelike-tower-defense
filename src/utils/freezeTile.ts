import type { KAPLAYCtx } from "kaplay";
import type { Tile } from "../types";
import { TILE_SIZE } from "../constants";

export function freezeTile(k: KAPLAYCtx, opts: {
    tile: Tile,
    x: number,
    y: number
}) {
    const { tile, x, y } = opts;

    if (tile.glowObj) {
        tile.glowObj.destroy();
        tile.glowObj = undefined;
    }

    if (tile.frozen) return;

    tile.frozen = true;
    tile.blocked = false;


    const sprite = tile.iceSprite ?? "default";

    const ice = k.add([
        k.sprite(`ice tile ${sprite}`),
        k.pos(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2),
        k.z(-1),
        k.anchor("center"),
        k.opacity(0),
        "iceTile",
        {
            add() {
                k.tween(0, 1, 2, v => ice.opacity = v, k.easings.easeOutBounce);
            }
        }
    ]);
}