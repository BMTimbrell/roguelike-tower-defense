import type { Vec2 } from "kaplay";
import type { EnemyGameObj } from "../types";
import { TILE_SIZE } from "../constants";

export default function isEnemyOnRay(
    enemy: EnemyGameObj,
    origin: Vec2,
    dir: Vec2, 
    maxRange: number,
    beamRadius: number
): boolean {
    const toEnemy = enemy.pos.sub(origin);

    const t = toEnemy.dot(dir);

    const enemyRadius = enemy.width ? enemy.width / 2 : TILE_SIZE * 0.4;
    if (t < -enemyRadius || t > maxRange + enemyRadius) return false;

    const closestPoint = origin.add(dir.scale(t));

    const distToRay = enemy.pos.dist(closestPoint);

    return distToRay <= beamRadius + enemyRadius;

}