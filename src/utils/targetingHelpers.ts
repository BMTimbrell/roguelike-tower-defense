import type { KAPLAYCtx, Vec2 } from "kaplay";
import { TILE_SIZE, TOWER_RANGE_TOLERANCE } from "../constants";
import type { EnemyGameObj, HeroGameObj, PathTile, TargetResolver, TowerGameObj } from "../types";

export function selectTarget(
    enemies: EnemyGameObj[],
    tower: TowerGameObj | HeroGameObj,
    origin: Vec2,
): EnemyGameObj | null {

    let best: EnemyGameObj | null = null;
    let bestDist = 0;

    for (const e of enemies) {

        const dist = e.pos.dist(origin);

        if (dist > tower.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
            continue;
        }

        if (!best) {
            best = e;
            bestDist = dist;
            continue;
        }

        switch (tower.priority) {

            case "Most Progress":
                if (e.pathIndex + e.segmentProgress > best.pathIndex + best.segmentProgress) {
                    best = e;
                }
                break;

            case "Least Progress":
                if (e.pathIndex + e.segmentProgress < best.pathIndex + best.segmentProgress) {
                    best = e;
                }
                break;

            case "Highest HP":
                if (e.hp() > best.hp()) {
                    best = e;
                }
                break;

            case "Lowest HP":
                if (e.hp() < best.hp()) {
                    best = e;
                }
                break;

            case "Closest":
                if (dist < bestDist) {
                    best = e;
                    bestDist = dist;
                }
                break;

            case "Furthest":
                if (dist > bestDist) {
                    best = e;
                    bestDist = dist;
                }
                break;
        }
    }

    return best;
}

export function shortestAngleDiff(a: number, b: number) {
    let diff = b - a;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
}

export function rotateVector(k: KAPLAYCtx, vec: Vec2, angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return k.vec2(
        vec.x * cos - vec.y * sin,
        vec.x * sin + vec.y * cos
    );
}

export function selectBounceTarget(
    k: KAPLAYCtx,
    from: EnemyGameObj,
    opts?: {
        bounceRange?: number,
        exclude?: Set<EnemyGameObj>,
        visited?: Set<EnemyGameObj>
    }
) {
    const exclude = opts?.exclude ?? new Set();
    const bounceRange = opts?.bounceRange ?? 0;
    const visited = opts?.visited ?? new Set();

    return (k
        .get("enemy") as EnemyGameObj[])
        .filter(e =>
            e !== from &&
            !e.isDying &&
            !exclude.has(e) &&
            e.pos.dist(from.pos) <= bounceRange
        )
        .sort((a, b) => {
            const aVisited = visited.has(a);
            const bVisited = visited.has(b);

            if (aVisited !== bVisited) {
                return aVisited ? 1 : -1;
            }

            return a.pos.dist(from.pos) - b.pos.dist(from.pos);
        })[0];
}

export function isValidTarget(e: EnemyGameObj) {
    return e.is("enemy") && !e.isDying;
}

export function findNewTarget(
    k: KAPLAYCtx,
    fromPos: Vec2,
    maxRange?: number
): EnemyGameObj | null {
    return (k
        .get("enemy") as EnemyGameObj[])
        .filter(e => !e.isDying && (!maxRange || e.pos.dist(fromPos) <= maxRange))
        .sort((a, b) =>
            a.pos.dist(fromPos) - b.pos.dist(fromPos)
        )[0] ?? null;
}

export function enemyTargetResolver(k: KAPLAYCtx, owner: TowerGameObj | HeroGameObj): TargetResolver {

    return () => {
        const enemy = selectTarget(
            k.get("enemy") as EnemyGameObj[],
            owner,
            owner.pos.add((owner.footprint.w * TILE_SIZE) / 2, (owner.footprint.h * TILE_SIZE) / 2)
        );

        return enemy ? { type: "enemy", enemy } : null;
    };
}

export function pathTargetResolver(
    k: KAPLAYCtx,
    pathTiles: PathTile[],
    owner: TowerGameObj | HeroGameObj
): TargetResolver {
    return () => {
        const origin = owner.pos.add((owner.footprint.w * TILE_SIZE) / 2, (owner.footprint.h * TILE_SIZE) / 2);
        const inRange = pathTiles.filter(t =>
            k.vec2(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2).
                dist(origin) <= owner.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE
        );

        if (inRange.length === 0) return null;

        // const best = inRange.reduce((a, b) =>
        //     (a.tile.pathIndex ?? 0) > (b.tile.pathIndex ?? 0) ? a : b
        // );

        const pathIndex = k.randi(inRange.length);
        const tile = inRange[pathIndex];
        const randomOffset = k.vec2(k.randi(-5, 6), k.randi(-5, 6));

        return {
            type: "point",
            pos: k.vec2(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2).add(randomOffset),
            pathIndex: tile.tile.pathIndex,
        };
    }
}