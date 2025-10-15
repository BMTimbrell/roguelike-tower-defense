import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';

export default function makeEnemy(k: KAPLAYCtx, waypoints: Vec2[]): GameObj {

    const enemy = k.add([
        k.pos(waypoints[0]),
        k.rect(16, 16),
        k.anchor("bot"),
        {
            waypoints,
            speed: 150
        }
    ]);

    enemy.onUpdate(() => {
        const dir = enemy.waypoints[1].sub(enemy.pos).unit();
        enemy.move(dir.scale(enemy.speed));

        if (enemy.pos.dist(enemy.waypoints[1]) <= 2) {
            if (enemy.waypoints.length <= 2) k.destroy(enemy);
            enemy.waypoints.shift();
        }

    });

    return enemy;
}