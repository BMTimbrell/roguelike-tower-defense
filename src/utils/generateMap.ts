import type { KAPLAYCtx } from "kaplay";
import type { MapData, PathTile, Tile } from "../types";
import { TILE_SIZE } from "../constants";

export default async function generateMap(k: KAPLAYCtx, filePath: string) {
    const mapData: MapData = await (await fetch(filePath)).json();

    const tileGrid: Tile[][] = [];

    const groundLayer = mapData.layers.find(
        layer => layer.name === "Ground"
    );

    if (!groundLayer || !groundLayer.data) {
        throw new Error("Ground layer not found");
    }

    for (let index = 0; index < groundLayer.data.length; index++) {
        const tileId = groundLayer.data[index];

        const x = index % mapData.width;
        const y = Math.floor(index / mapData.width);

        if (!tileGrid[y]) tileGrid[y] = [];

        tileGrid[y][x] = {
            blocked: tileId === 2,
            isPath: tileId === 2
        };
    }

    const waypoints = mapData.layers
        .find(layer => layer.name === "Waypoints")
        ?.objects?.map(obj => k.vec2(obj.x + TILE_SIZE / 2, obj.y + TILE_SIZE / 2));

    if (!waypoints) {
        throw new Error("Waypoints not found");
    }

    let index = 0

    for (const wp of waypoints) {
        const tx = Math.floor(wp.x / TILE_SIZE)
        const ty = Math.floor(wp.y / TILE_SIZE)

        const tile = tileGrid[ty]?.[tx]
        if (tile && tile.isPath) {
            tile.pathIndex = index++
        }
    }

    const pathTiles: PathTile[] = [];

    for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            const tile = tileGrid[y][x];
            if (tile.isPath) {
                pathTiles.push({ x, y, tile });
            }
        }
    }

    // Generate tile grid for placement logic

    // mapData.layers.find(layer => layer.name === "Ground")?.data?.forEach((tile, index) => {
    //     const x = index % mapData.width;
    //     const y = Math.floor(index / mapData.width);
    //     if (!tileGrid[y]) tileGrid[y] = [];
    //     tileGrid[y][x] = tile !== 1;
    // });

    return {
        mapData,
        tileGrid,
        pathTiles
    }
}