import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj } from "../types";

export default function enemiesInCone(
    k: KAPLAYCtx,
    origin: Vec2,
    forward: Vec2,
    range: number,
    coneAngle: number
): EnemyGameObj[] {

    const enemies = k.get("targetable") as EnemyGameObj[];

    const halfAngle = (coneAngle * Math.PI / 180) / 2;

    const result: EnemyGameObj[] = [];

    enemies.forEach(e => {

        const toEnemy = e.pos.sub(origin);
        const dist = toEnemy.len();

        const radius = e.width / 2;
        if (dist > range + radius) return;

        const angleSlack = Math.asin(Math.min(radius / dist, 1));
        const coneLimit = Math.cos(halfAngle + angleSlack);

        const dirToEnemy = toEnemy.unit();
        const dot = forward.dot(dirToEnemy);

        if (dot >= coneLimit) {
            result.push(e);
        }

    });

    return result;
}