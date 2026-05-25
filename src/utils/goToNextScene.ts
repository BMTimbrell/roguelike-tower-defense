import type { KAPLAYCtx } from "kaplay";
import type { LevelWaves, MapData, PathTile, Scene, Tile } from "../types";
import { ENEMIES, type LevelId } from "../constants";
import { playSfx } from "./soundHelpers";

export default function goToNextScene(k: KAPLAYCtx, opts: {
    sceneName: Scene,
    mapData: MapData,
    tileGrid: Tile[][],
    pathTiles: PathTile[],
    wave: LevelId,
    level: LevelWaves
}) {
    const { sceneName, mapData, tileGrid, pathTiles, wave, level } = opts;

    if (level.boss) {
        playSfx(k, "boss drums");
        const bossId = level.boss.id;
        const sprite = ENEMIES[bossId].sprite;

        const bossSprite = k.add([
            k.sprite(sprite, { anim: "move" }),
            k.pos(k.center()),
            k.scale(4),
            k.anchor("center")
        ]);

        k.add([
            k.text(sprite.toUpperCase(), {
                size: 16,
                font: "free pixel"
            }),
            k.anchor("center"),
            k.scale(4),
            k.pos(k.center().sub(0, bossSprite.height))
        ]);

        k.wait(1, () => {
            k.go(sceneName, { mapData, tileGrid, pathTiles, wave });
        });
    } else {
        k.go(sceneName, { mapData, tileGrid, pathTiles, wave });
    }
}