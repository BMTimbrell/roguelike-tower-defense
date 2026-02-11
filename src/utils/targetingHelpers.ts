import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { TILE_SIZE, TOWER_RANGE_TOLERANCE } from "../constants";

export function selectTarget(
    enemies: GameObj[],
    tower: GameObj,
    rangePos: Vec2,
): GameObj | null {

    let best: GameObj | null = null

    for (const e of enemies) {
        if (e.pos.dist(rangePos) > tower.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
            continue;
        }

        if (!best) {
            best = e;
            continue;
        }

        switch (tower.priority) {
            case "Most Progress":
                if (e.pathIndex + e.segmentProgress > best.pathIndex + best.segmentProgress) best = e;
                break;

            case "Least Progress":
                if (e.pathIndex + e.segmentProgress < best.pathIndex + best.segmentProgress) best = e;
                break;

            case "Highest HP":
                if (e.hp() > best.hp()) best = e;
                break;

            case "Lowest HP":
                if (e.hp() < best.hp()) best = e;
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