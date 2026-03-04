import type { Vec2 } from "kaplay";
import type { EnemyGameObj } from "../types";
import { TILE_SIZE } from "../constants";

export default function isEnemyOnRay(
    enemy: EnemyGameObj,
    origin: Vec2,
    dir: Vec2,          // MUST be normalized
    maxRange: number,
    beamRadius: number // half-width of laser
): boolean {
    const toEnemy = enemy.pos.sub(origin);

    // Distance along the ray (dot product)
    const t = toEnemy.dot(dir);

    const enemyRadius = enemy.width ? enemy.width / 2 : TILE_SIZE * 0.4;

    // Behind the origin or beyond range
    if (t < -enemyRadius || t > maxRange + enemyRadius) return false;

    // Closest point on ray to enemy
    const closestPoint = origin.add(dir.scale(t));

    // Perpendicular distance from enemy to ray
    const distToRay = enemy.pos.dist(closestPoint);

    return distToRay <= beamRadius + enemyRadius;

}