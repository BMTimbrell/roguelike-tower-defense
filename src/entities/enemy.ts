import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import { store, gameStateAtom } from '../store';
import type { EnemyId } from '../constants';
import { ELEMENTS, ENEMIES, SMALL_DAMAGE_NUMBER_SIZE } from '../constants';
import makeFloatingText from './FloatingText';

type BurnThis = {
    hurt: (amount: number) => void
    unuse: (id: string) => void,
    maxHP: () => number,
    pos: Vec2
}

export function burnEffect(k: KAPLAYCtx, duration: number) {
    let timer = duration;
    const tickRate = 1;
    let tickTimer = tickRate;

    return {
        id: "burn",

        require: ["health", "pos"],

        refresh(newDuration: number) {
            timer = newDuration;
        },

        update() {
            tickTimer += k.dt();
            timer -= k.dt();

            if (tickTimer >= tickRate) {
                tickTimer = 0;

                const damage = Math.max(1, Math.round(this.maxHP() * 0.01));
                this.hurt(damage);

                makeFloatingText(k, {
                    pos: this.pos,
                    text: '' + damage,
                    size: SMALL_DAMAGE_NUMBER_SIZE,
                    color: ELEMENTS["Fire"].color
                });
            }

            if (timer <= 0) {
                this.unuse("burn");
            }
        },
    } satisfies ThisType<BurnThis>
}

export default function makeEnemy(k: KAPLAYCtx, enemyId: EnemyId, waypoints: Vec2[]): GameObj {

    const enemy = k.add([
        k.pos(waypoints[0]),
        k.rect(16, 16),
        k.anchor("bot"),
        k.area({
            shape: new k.Rect(k.vec2(0), 16, 16)
        }),
        k.health(ENEMIES[enemyId].hp, ENEMIES[enemyId].hp),
        {
            path: waypoints,
            pathIndex: 0,
            segmentStart: waypoints[0],
            segmentProgress: 0,
            speed: ENEMIES[enemyId].speed,
            damage: ENEMIES[enemyId].damage
        },
        "enemy",
        enemyId
    ]);

    enemy.onDeath(() => {
        store.set(gameStateAtom, prev => ({
            ...prev,
            gold: prev.gold + enemy.damage
        }));
        k.destroy(enemy);
    });

    enemy.onUpdate(() => {
        const next = enemy.path[enemy.pathIndex + 1];
        if (!next) return;

        const dir = next.sub(enemy.pos).unit();
        enemy.move(dir.scale(enemy.speed));

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