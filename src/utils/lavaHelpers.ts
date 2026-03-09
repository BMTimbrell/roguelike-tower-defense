import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj, Tile, TowerGameObj } from "../types";
import hurtEnemy from "./hurtEnemy";
import { CURSE_CRIT, TILE_SIZE } from "../constants";
import calcDamage from "./calcDamage";

export function makeLavaManager(k: KAPLAYCtx) {
    let tick = 0;
    const tickRate = 0.4;

    k.onUpdate(() => {
        tick += k.dt();

        if (tick < tickRate) return;
        tick -= tickRate;

        const enemies = k.get("enemy") as EnemyGameObj[];
        const lavaTiles = k.get("lava tile");

        const damaged = new Set<number>();

        enemies.forEach(e => {
            for (const lava of lavaTiles) {

                if (e.pos.dist(lava.pos) < TILE_SIZE / 2 + e.width / 2) {

                    if (damaged.has(e.id ?? 0)) break;
                    console.log("hi")
                    damaged.add(e.id ?? 0);

                    const tower = (k.get("tower") as TowerGameObj[]).find(t => t.instanceId === lava.towerId);

                    if (!tower) return;

                    const { damage, isCrit } = calcDamage({
                        damage: tower.stats.damage,
                        bonusDamage: 0,
                        bonusCritChance: e.has("curse") ? CURSE_CRIT : 0,
                        critChance: tower.stats.critChance,
                        critDamage: tower.stats.critDamage
                    });

                    hurtEnemy(k, {
                        target: e,
                        damage,
                        isCrit,
                        element: "Fire"
                    });

                    break;
                }
            }
        });
    });
}

export function makeLavaTile(k: KAPLAYCtx, pos: Vec2, tower: TowerGameObj) {
    const lava = k.add([
        k.sprite("lava tile"),
        k.anchor("center"),
        k.pos(pos.add(TILE_SIZE / 2)),
        {
            towerId: tower.instanceId
        },
        "lava tile"
    ]);

    return lava;
}

export function getLavaTiles(
    k: KAPLAYCtx,
    start: Vec2,
    range: number,
    tileGrid: Tile[][]
) {
    const lavaPositions = new Set<string>();

    k.get("lava tile").forEach(lava => {
        const gx = Math.floor(lava.pos.x / TILE_SIZE);
        const gy = Math.floor(lava.pos.y / TILE_SIZE);
        lavaPositions.add(`${gx},${gy}`);
    });

    const visited = new Set<string>();
    const queue: Vec2[] = [];
    const tiles: Vec2[] = [];

    const towerTiles = [
        start,
        start.add(k.vec2(TILE_SIZE, 0)),
        start.add(k.vec2(0, TILE_SIZE)),
        start.add(k.vec2(TILE_SIZE, TILE_SIZE)),
    ];

    const directions = [
        k.vec2(TILE_SIZE, 0),
        k.vec2(-TILE_SIZE, 0),
        k.vec2(0, TILE_SIZE),
        k.vec2(0, -TILE_SIZE),
    ];

    towerTiles.forEach(tile => {
        directions.forEach(dir => {
            const neighbor = tile.add(dir);

            const gx = Math.floor(neighbor.x / TILE_SIZE);
            const gy = Math.floor(neighbor.y / TILE_SIZE);

            const gridTile = tileGrid[gy]?.[gx];

            if (gridTile?.isPath) {
                queue.push(neighbor);
            }
        });
    });

    while (queue.length) {
        const tile = queue.shift()!;

        const gx = Math.floor(tile.x / TILE_SIZE);
        const gy = Math.floor(tile.y / TILE_SIZE);
        const key = `${gx},${gy}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (tile.add(TILE_SIZE / 2, TILE_SIZE / 2).dist(start.add(k.vec2(TILE_SIZE, TILE_SIZE))) > range) continue;

        if (!lavaPositions.has(key)) {
            tiles.push(tile);
        }

        directions.forEach(dir => {
            const neighbor = tile.add(dir);

            const ngx = Math.floor(neighbor.x / TILE_SIZE);
            const ngy = Math.floor(neighbor.y / TILE_SIZE);

            const gridTile = tileGrid[ngy]?.[ngx];

            if (gridTile?.isPath) {
                queue.push(neighbor);
            }
        });
    }

    return tiles;
}

export function rebuildLava(k: KAPLAYCtx, tower: TowerGameObj) {
    if (!tower.lavaTiles) return;
    tower.lavaTiles = [];
    k.get("lava tile").forEach(l => {
        if (l.towerId === tower.instanceId) k.destroy(l);
    });

    tower.lavaTiles = getLavaTiles(k, tower.pos, tower.stats.range * TILE_SIZE, tower.tileGrid);

    tower.lavaTiles.forEach(pos => makeLavaTile(k, pos, tower));
}