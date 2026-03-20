import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import { store, gameStateAtom } from '../store';
import type { EnemyId, ProjectileId } from '../constants';
import { ENEMIES, STUN_DURATION, TILE_SIZE } from '../constants';
import healthBar from '../kaplayComponents/healthBar';
import statusEffect from '../kaplayComponents/statusEffect';
import type { EnemyGameObj, TowerGameObj } from '../types';
import makeEnemyProjectile from './EnemyProjectile';

export default function makeEnemy(k: KAPLAYCtx, enemyId: EnemyId, waypoints: Vec2[], pathIndex: number = 0, pos?: Vec2): GameObj {

    const enemy: EnemyGameObj = k.add([
        k.pos(pos ?? waypoints[pathIndex]),
        k.sprite(ENEMIES[enemyId].sprite, { anim: "move" }),
        k.anchor("center"),
        k.area({
            shape: new k.Rect(k.vec2(0), 16, 16)
        }),
        k.rotate(),
        k.timer(),
        k.opacity(1),
        k.health(ENEMIES[enemyId].hp, ENEMIES[enemyId].hp),
        {
            path: waypoints,
            pathIndex,
            segmentStart: waypoints[0],
            segmentProgress: 0,
            baseSpeed: ENEMIES[enemyId].speed,
            speed: ENEMIES[enemyId].speed,
            damage: ENEMIES[enemyId].damage,
            isDying: false,
            armour: (ENEMIES[enemyId] as Record<"armour", number>).armour ?? 0,
            maxArmour: (ENEMIES[enemyId] as Record<"armour", number>).armour ?? 0,
            ...("healer" in ENEMIES[enemyId] ? { healer: ENEMIES[enemyId].healer as { amount: number; range: number; }, healTickRate: 2 } : {}),
            ...("spawnOnDeath" in ENEMIES[enemyId] ? { spawnOnDeath: ENEMIES[enemyId].spawnOnDeath as { id: "slime"; amount: number; } } : {}),
            ...("attacker" in ENEMIES[enemyId] ? { attacker: ENEMIES[enemyId].attacker as { 
                projectile: ProjectileId;
                attackRange: number;
                attackCooldown: number;
                canAttack: boolean;
             } } : {}),
             debuffDurationMultiplier: 1,
             invincibleCooldown: "invincibleCooldown" in ENEMIES[enemyId] ? ENEMIES[enemyId].invincibleCooldown as number : 0,
             invincibleTimer: "invincibleCooldown" in ENEMIES[enemyId] ? ENEMIES[enemyId].invincibleCooldown as number : 0,
             invincible: false,
             invincibleDuration: "invincibleDuration" in ENEMIES[enemyId] ? ENEMIES[enemyId].invincibleDuration as number : 2
        },
        k.state("move", ["move", "stunned", "attack"]),
        statusEffect(),
        k.z(1),
        "enemy",
        enemyId
    ]);

    enemy.onHurt(amount => {
        if (amount === undefined) {
            return;
        }

        const prevDamageDealt = store.get(gameStateAtom).heroCharge.damageDealt;
        const damageDealt = prevDamageDealt + (enemy.hp() > 0 ? amount : amount + enemy.hp());

        store.set(gameStateAtom, prev => ({
            ...prev,
            heroCharge: {
                ...prev.heroCharge,
                damageDealt,
                charge: Math.min((damageDealt) / prev.heroCharge.damageRequired, 1)
            }
        }));

        if (enemy.isDying) return;

        if (!enemy.has("healthBar")) {
            enemy.use(healthBar(k, 2));
        }
    });

    enemy.onAnimEnd(anim => {
        if (anim === "die") {
            k.destroy(enemy);
        }
    });

    enemy.onStateEnter("move", () => {
        enemy.play("move");
    }); 

    enemy.onStateEnter("stunned", () => {
        enemy.play("idle");
        enemy.wait(STUN_DURATION, () => {
            enemy.enterState("move");
        });
    });

    let healTimer = enemy.healTickRate ?? 0;
    let attackTimer = enemy.attacker?.attackCooldown ?? 0;
    let dir = k.vec2(0);

    enemy.onStateUpdate("move", () => {
        if (enemy.isDying) return;

        if (enemy.invincibleCooldown && enemy.invincibleTimer > 0) {
            enemy.invincibleTimer -= k.dt();
            if (enemy.invincibleTimer <= 0) enemy.invincible = true;
        }

        if (enemy.invincible) {
            enemy.invincibleDuration -= k.dt();
            if (enemy.invincibleDuration <= 0) {
                enemy.invincible = false;
                enemy.invincibleTimer += enemy.invincibleCooldown;
                enemy.invincibleDuration = 2;
            }

            enemy.statuses.forEach(s => { 
                if (enemy.has(s)) enemy.unuse(s);
            });
            enemy.opacity = enemy.invincible ? 0.5 : 1;
        }

        enemy.z = enemy.pos.y;

        const next = enemy.path[enemy.pathIndex + 1];
        if (!next) return;

        dir = next.sub(enemy.pos).unit();
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

        // attacker
        if (enemy.attacker) {
            attackTimer -= k.dt();
    
            while (attackTimer <= 0) {
                const towers = (k.get("tower") as TowerGameObj[]).filter(
                    t => t.placed && enemy.pos.dist(t.pos) <= enemy.attacker!.attackRange * TILE_SIZE
                );
                if (!towers.length) break;
    
                const index = k.randi(towers.length);
                makeEnemyProjectile(k, { 
                    id: enemy.attacker.projectile as ProjectileId, 
                    pos: enemy.pos, 
                    target: towers[index], 
                    hitChance: enemy.has("blind") ? 0.5 : 1
                });
    
                attackTimer += enemy.attacker.attackCooldown;
            }
        }


        // healing enemies if healer
        if (!enemy.healer && !enemy.healTickRate) return;

        healTimer -= k.dt();

        while (healTimer <= 0) {
            const circleEffect = k.add([
                k.circle(2, { fill: false }),
                k.color(),
                k.outline(1, k.rgb(0, 255, 0)),
                k.anchor("center"),
                k.pos(enemy.pos),
                k.lifespan(0.5),
                k.opacity(1),
                k.scale(1),
                {
                    update() {
                        circleEffect.radius += k.dt() * 90;
                        circleEffect.opacity -= k.dt() * 0.5;
                        circleEffect.pos = enemy.pos
                    }
                }
            ]);

            k.get("enemy").forEach(e => {
                if (!enemy.has("curse") && e.pos.dist(enemy.pos) <= enemy.healer!.range * TILE_SIZE) {
                    e.heal(enemy.healer!.amount);
                    const healEffect = k.add([
                        k.sprite("heal effect", { anim: "heal" }),
                        k.pos(e.pos),
                        k.anchor("center"),
                        k.opacity(1),
                        {
                            update() {
                                healEffect.pos = e.pos;
                            }
                        }
                    ]);

                    healEffect.onAnimEnd(() => k.destroy(healEffect));
                }
            });

            healTimer += enemy.healTickRate!;
        }

    });

    enemy.onHeal(() => {
        if (enemy.has("poison")) {
            enemy.unuse("poison");
        }
    });

    enemy.onDeath(() => {
        if (enemy.isDying) return;

        if (enemy.spawnOnDeath) {

            const mid = enemy.spawnOnDeath.amount / 2;

            for (let i = 0; i < enemy.spawnOnDeath.amount; i++) {
                const posOffset = (i - mid) * 12;
                const posOffsetX = Math.abs(dir.x) > 0.5 ? posOffset : 0;
                const posOffsetY = Math.abs(dir.y) > 0.5 ? posOffset : 0;

                const spawnedEnemy = makeEnemy(k, 
                    enemy.spawnOnDeath.id, 
                    enemy.path, 
                    enemy.pathIndex, 
                    k.vec2(enemy.pos).add(posOffsetX, posOffsetY)
                );

                spawnedEnemy.invincible = true;
                spawnedEnemy.invincibleDuration = 0.1;
            }
        }

        enemy.isDying = true;
        store.set(gameStateAtom, prev => ({
            ...prev,
            gold: prev.gold + enemy.damage
        }));
        enemy.untag("enemy");
        enemy.unuse("area");
        enemy.play("die");
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