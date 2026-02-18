import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import { store, gameStateAtom } from '../store';
import type { EnemyId } from '../constants';
import { ENEMIES } from '../constants';
import healthBar from '../kaplayComponents/healthBar';
import statusEffect from '../kaplayComponents/statusEffect';

export default function makeEnemy(k: KAPLAYCtx, enemyId: EnemyId, waypoints: Vec2[]): GameObj {

    const enemy = k.add([
        k.pos(waypoints[0]),
        k.sprite(ENEMIES[enemyId].sprite, { anim: "move" }),
        k.anchor("center"),
        k.area({
            shape: new k.Rect(k.vec2(0), 16, 16)
        }),
        k.rotate(),
        k.health(ENEMIES[enemyId].hp, ENEMIES[enemyId].hp),
        {
            path: waypoints,
            pathIndex: 0,
            segmentStart: waypoints[0],
            segmentProgress: 0,
            baseSpeed: ENEMIES[enemyId].speed,
            speed: ENEMIES[enemyId].speed,
            damage: ENEMIES[enemyId].damage,
            isDying: false
        },
        statusEffect(),
        "enemy",
        enemyId
    ]);

    enemy.onHurt(amount => {
        if (!amount) {
            return;
        }

        const damageDealt = store.get(gameStateAtom).heroCharge.damageDealt;
        store.set(gameStateAtom, prev => ({
            ...prev,
            heroCharge: {
                ...prev.heroCharge,
                damageDealt: damageDealt + amount,
                charge: Math.min((damageDealt + amount) / prev.heroCharge.damageRequired, 1)
            }
        }));

        if (enemy.isDying) return;

        if (!enemy.has("healthBar")) {
            enemy.use(healthBar(k, 2));
        }
    });

    enemy.onDeath(() => {
        if (enemy.isDying) return;

        enemy.isDying = true;
        store.set(gameStateAtom, prev => ({
            ...prev,
            gold: prev.gold + enemy.damage
        }));
        enemy.untag("enemy");
        enemy.unuse("area");
        enemy.play("die");
    });

    enemy.onAnimEnd(anim => {
        if (anim === "die") {
            k.destroy(enemy);
        }
    });

    enemy.onUpdate(() => {
        if (enemy.isDying) return;

        const next = enemy.path[enemy.pathIndex + 1];
        if (!next) return;

        const dir = next.sub(enemy.pos).unit();
        enemy.move(dir.scale(enemy.speed));

        enemy.angle = dirToRotation(dir);

        const segmentLen = enemy.segmentStart.dist(next);
        const traveled = enemy.pos.dist(enemy.segmentStart);

        enemy.segmentProgress = segmentLen > 0
            ? traveled / segmentLen
            : 1;

        if (enemy.pos.dist(next) <= enemy.speed / 50) {
            enemy.pathIndex++;
            enemy.segmentStart = enemy.path[enemy.pathIndex];
            enemy.segmentProgress = 0;

            if (enemy.pathIndex >= enemy.path.length - 1) {
                k.destroy(enemy);
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    health: prev.health - enemy.damage
                }));
            }
        }

    });

    return enemy;
}

function dirToRotation(dir: Vec2) {
    if (Math.abs(dir.x) > Math.abs(dir.y)) {
        // horizontal
        return dir.x > 0 ? -90 : 90;
    } else {
        // vertical
        return dir.y > 0 ? 0 : 180;
    }
}