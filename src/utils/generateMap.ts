import type { KAPLAYCtx } from "kaplay";
import type { MapData, PathTile, Tile } from "../types";
import { TILE_SIZE } from "../constants";

export default async function generateMap(k: KAPLAYCtx, filePath: string) {
    const mapData: MapData = await (await fetch(filePath)).json();

    const tileGrid: Tile[][] = [];
    let treeArea: {
        x: number;
        y: number;
        numTrees: number;
        width: number;
        height: number;
    } | null = null;

    const pathLayer = mapData.layers.find(
        layer => layer.name === "Path"
    );

    const treeLayer = mapData.layers.find(layer => layer.name === "Trees");

    if (treeLayer?.objects?.[0]) {
        treeArea = {
            x: treeLayer.objects[0].x,
            y: treeLayer.objects[0].y,
            width: treeLayer.objects[0].width,
            height: treeLayer.objects[0].height,
            numTrees: Number(treeLayer.objects[0].name)
        };

    }

    if (!pathLayer || !pathLayer.data) {
        throw new Error("Path layer not found");
    }

    for (let index = 0; index < pathLayer.data.length; index++) {
        const tileId = pathLayer.data[index];

        const x = index % mapData.width;
        const y = Math.floor(index / mapData.width);

        if (!tileGrid[y]) tileGrid[y] = [];

        tileGrid[y][x] = {
            blocked: tileId !== 0,
            isPath: tileId !== 0
        };
    }

    if (treeArea) {
        const startX = Math.floor(treeArea.x / TILE_SIZE);
        const startY = Math.floor(treeArea.y / TILE_SIZE);
        const endX = Math.floor((treeArea.x + treeArea.width) / TILE_SIZE);
        const endY = Math.floor((treeArea.y + treeArea.height) / TILE_SIZE);

        const maxTrees = treeArea.numTrees || 20;
        let placed = 0;
        let attempts = 0;
        const maxAttempts = maxTrees * 5;

        while (placed < maxTrees && attempts < maxAttempts) {
            attempts++;

            const tx = Math.floor(Math.random() * (endX - startX)) + startX;
            const ty = Math.floor(Math.random() * (endY - startY)) + startY;

            const tile = tileGrid[ty]?.[tx];

            if (!tile) continue;

            if (tile.blocked) continue;
            if (tile.hasTree) continue;

            tile.hasTree = true;
            tile.blocked = true;

            placed++;
        }
    }

    const waypoints = mapData.layers
        .find(layer => layer.name === "Waypoints")
        ?.objects?.map(obj => k.vec2(obj.x + TILE_SIZE / 2, obj.y + TILE_SIZE / 2));

    if (!waypoints) {
        throw new Error("Waypoints not found");
    }

    let index = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        const dir = end.sub(start).unit();
        const dist = start.dist(end);

        for (let d = 0; d <= dist; d += TILE_SIZE) {
            const pos = start.add(dir.scale(d));

            const tx = Math.floor(pos.x / TILE_SIZE);
            const ty = Math.floor(pos.y / TILE_SIZE);

            const tile = tileGrid[ty]?.[tx];

            if (tile && tile.isPath && tile.pathIndex === undefined) {
                tile.pathIndex = index++;
            }
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

    pathTiles.sort((a, b) => (a.tile.pathIndex ?? 0) - (b.tile.pathIndex ?? 0));

    return {
        mapData,
        tileGrid,
        pathTiles
    };
}