import { type KAPLAYCtx, type Vec2, type GameObj } from 'kaplay';
import { store, gameStateAtom } from '../store';
import type { EnemyId, ProjectileId } from '../constants';
import { ENEMIES, HARD_HEALTH_MULT, STUN_DURATION, TILE_SIZE, TOWER_RANGE_TOLERANCE } from '../constants';
import healthBar from '../kaplayComponents/healthBar';
import statusEffect from '../kaplayComponents/statusEffect';
import type { EnemyGameObj, TowerGameObj } from '../types';
import makeEnemyProjectile from './EnemyProjectile';
import { aoeBurst } from '../utils/makeUnitCombat';

export default function makeEnemy(
    k: KAPLAYCtx,
    enemyId: EnemyId,
    waypoints: Vec2[],
    pathIndex: number = 0,
    pos?: Vec2,
    stopIndexes?: number[]
) {
    const difficulty = store.get(gameStateAtom).difficulty;
    const health = ENEMIES[enemyId].hp * (difficulty === "hard" ? HARD_HEALTH_MULT : 1);

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
        k.health(health, health),
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
            ...("spawnArmourOnDeath" in ENEMIES[enemyId] ? { spawnArmourOnDeath: ENEMIES[enemyId].spawnArmourOnDeath as { amount: number; range: number; } } : {}),
            ...("attacker" in ENEMIES[enemyId] ? {
                attacker: ENEMIES[enemyId].attacker as {
                    projectile: ProjectileId;
                    attackRange: number;
                    attackCooldown: number;
                    canAttack: boolean;
                }
            } : {}),
            ...("speedBooster" in ENEMIES[enemyId] ? { speedBooster: ENEMIES[enemyId].speedBooster as { amount: number; range: number; } } : {}),
            ...("isBoss" in ENEMIES[enemyId] && ENEMIES[enemyId].isBoss ? {
                boss: {
                    currentStopIndex: 0,
                    stopIndexes: stopIndexes ?? [],
                    reachedStopIndex: false
                }
            } : {}),
            debuffDurationMultiplier: 1,
            invincibleCooldown: "invincibleCooldown" in ENEMIES[enemyId] ? ENEMIES[enemyId].invincibleCooldown as number : 0,
            invincibleTimer: "invincibleCooldown" in ENEMIES[enemyId] ? ENEMIES[enemyId].invincibleCooldown as number : 0,
            invincible: false,
            invincibleDuration: "invincibleDuration" in ENEMIES[enemyId] ? ENEMIES[enemyId].invincibleDuration as number : 2,
            stunResistance: false,
            stunResistanceDuration: 3,
            stunResistanceTimer: 0,
            ...("spawnIce" in ENEMIES[enemyId] ? { spawnIce: ENEMIES[enemyId].spawnIce as boolean } : {}),
            speedMultipliers: {
                chill: 1,
                boost: 1,
                wind: 1,
                ice: 1
            }
        },
        k.state("move", ["move", "stunned", "attack", "idle"]),
        statusEffect(),
        k.z(1),
        "enemy",
        "isBoss" in ENEMIES[enemyId] && ENEMIES[enemyId].isBoss ? "boss" : "",
        enemyId
    ]);

    if (enemy.boss) enemy.use(healthBar(k, 1, { isBoss: true }));

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
                charge: Math.min((damageDealt) / prev.heroCharge.damageRequired / (difficulty === "hard" ? HARD_HEALTH_MULT : 1), 1)
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

    enemy.onStateEnter("idle", () => {
        enemy.play("move");
    });

    enemy.onStateEnter("move", () => {
        enemy.play("move");
    });

    enemy.onStateEnter("stunned", () => {
        enemy.stunResistanceTimer = enemy.stunResistanceDuration;
        enemy.stunResistance = true;
        enemy.play("idle");
        const dizzyEffect = k.add([
            k.sprite("dizzy", { anim: "dizzy" }),
            k.anchor("center"),
            k.pos(enemy.pos),
            k.z(999),
            `dizzy ${enemy.id}`
        ]);
        enemy.wait(STUN_DURATION, () => {
            k.destroy(dizzyEffect);
            if (enemy?.boss?.reachedStopIndex) enemy.enterState("attack");
            enemy.enterState("move");
        });
    });

    let healTimer = enemy.healTickRate ?? 0;
    let attackTimer = 0;
    let dir = k.vec2(0);

    // attack for boss
    enemy.onStateUpdate("attack", () => {
        if (enemy.stunResistanceTimer > 0) {
            enemy.stunResistanceTimer -= k.dt();
        } else enemy.stunResistance = false;

        while (attackTimer <= 0 && store.get(gameStateAtom).waveActive) {
            const towers = (k.get("tower") as TowerGameObj[]).filter(
                t => t.placed && t.name !== "Farm Tower" && enemy.pos.dist(t.pos.add((t.footprint.w * TILE_SIZE) / 2, (t.footprint.h * TILE_SIZE) / 2)) <= enemy.attacker!.attackRange * TILE_SIZE
            );
            if (!towers.length) break;

            const index = k.randi(towers.length);
            makeEnemyProjectile(k, {
                id: enemy.attacker!.projectile as ProjectileId,
                pos: enemy.pos,
                target: towers[index],
                hitChance: enemy.has("blind") ? 0.5 : 1
            });

            attackTimer += enemy.attacker!.attackCooldown;
        }
        if (attackTimer > 0) {
            attackTimer -= k.dt();
        }

        if (!store.get(gameStateAtom).waveActive) {
            enemy.statuses.forEach(s => {
                if (enemy.has(s)) enemy.unuse(s);
            });
        }
    });

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

        if (enemy.stunResistanceTimer > 0) {
            enemy.stunResistanceTimer -= k.dt();
        } else enemy.stunResistance = false;

        if (enemy.attacker && attackTimer > 0) attackTimer -= k.dt();

        enemy.z = enemy.pos.y;

        // boss
        if (enemy.boss && enemy.boss.stopIndexes.length) {
            const stopIndex = enemy.boss.stopIndexes[enemy.boss.currentStopIndex];

            if (enemy.pathIndex >= stopIndex) {
                enemy.boss.reachedStopIndex = true;
                enemy.enterState("attack");
                return;
            }
        }

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
        if (enemy.attacker && !enemy.boss) {
            while (attackTimer <= 0) {
                const towers = (k.get("tower") as TowerGameObj[]).filter(
                    t => t.placed && t.name !== "Farm Tower" && enemy.pos.dist(t.pos.add((t.footprint.w * TILE_SIZE) / 2, (t.footprint.h * TILE_SIZE) / 2)) <= enemy.attacker!.attackRange * TILE_SIZE
                );
                if (!towers.length) break;

                const index = k.randi(towers.length);
                makeEnemyProjectile(k, {
                    id: enemy.attacker!.projectile as ProjectileId,
                    pos: enemy.pos,
                    target: towers[index],
                    hitChance: enemy.has("blind") ? 0.5 : 1
                });

                attackTimer += enemy.attacker!.attackCooldown;
            }
        }

        const enemies = k.get("enemy") as EnemyGameObj[];

        enemies.forEach(e => {
            let bestBoost = 1;

            enemies.forEach(source => {
                if (!source.speedBooster) return;

                if (
                    e.pos.dist(source.pos) <=
                    source.speedBooster.range * TILE_SIZE &&
                    !e.speedBooster
                ) {
                    bestBoost = Math.max(bestBoost, source.speedBooster.amount);
                }
            });

            if (e.speedMultipliers.boost !== bestBoost) {
                e.speedMultipliers.boost = bestBoost;
                updateSpeed.call(e);
            }
        });

        // speed on ice
        const iceTiles = k.get("slime ice");


        let boost = 1;
        for (const ice of iceTiles) {
            if (enemy.pos.dist(ice.pos) <= TILE_SIZE / 2) {
                boost = 3;
                break;
            }
        }

        if (enemy.speedMultipliers.ice !== boost) {
            enemy.speedMultipliers.ice = boost;
            updateSpeed.call(enemy);
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
            if (k.get("hero")[0]?.festeringToxins) {
                const remainingStacks = (enemy as GameObj).removeStack();
                if (remainingStacks < 1) enemy.unuse("poison");
            } else enemy.unuse("poison");
        }
    });

    if (enemy.speedBooster) {
        const boostRing = k.add([
            k.circle(enemy.speedBooster.range * TILE_SIZE, { fill: false }),
            k.color(),
            k.outline(1, k.rgb(177, 237, 255)),
            k.anchor("center"),
            k.pos(enemy.pos),
            k.opacity(1),
            k.scale(1),
            {
                update() {
                    boostRing.pos = enemy.pos;
                    boostRing.opacity = 1 + Math.sin(k.time() * 3) * 0.1;
                }
            }
        ]);

        enemy.onDeath(() => {
            k.destroy(boostRing);
        });

        enemy.onDestroy(() => {
            k.destroy(boostRing);
        });
    }

    enemy.onDeath(() => {
        if (enemy.isDying) return;

        const dizzyEffect = k.get(`dizzy ${enemy.id}`)[0];
        if (dizzyEffect) k.destroy(dizzyEffect);

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

        if (enemy.spawnArmourOnDeath) {
            (k.get("enemy") as EnemyGameObj[]).forEach(e => {
                if (e.pos.dist(enemy.pos) <= enemy.spawnArmourOnDeath!.range * TILE_SIZE) {
                    e.armour = e.armour + enemy.spawnArmourOnDeath!.amount;
                    e.maxArmour = e.maxArmour + enemy.spawnArmourOnDeath!.amount;
                }
            });

            aoeBurst(k, enemy.pos, 2, "shield", 1.5);
        }

        if (enemy.spawnIce) {
            k.add([
                k.sprite("ice puddle"),
                k.anchor("center"),
                k.pos(enemy.pos),
                k.lifespan(2),
                k.opacity(1),
                "slime ice"
            ]);
        }

        const hero = k.get("hero")[0];
        const goldBonusMod = hero?.goldRush && hero?.pos.dist(enemy.pos) <= hero.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE ?
            hero.goldRushBoost : 1;
        enemy.isDying = true;
        store.set(gameStateAtom, prev => ({
            ...prev,
            gold: prev.gold + (enemy.damage * goldBonusMod)
        }));
        enemy.untag("enemy");
        enemy.unuse("area");
        enemy.play("die");
    });

    return enemy;
}

export function dirToRotation(dir: Vec2) {
    if (Math.abs(dir.x) > Math.abs(dir.y)) {
        // horizontal
        return dir.x > 0 ? -90 : 90;
    } else {
        // vertical
        return dir.y > 0 ? 0 : 180;
    }
}

export function updateSpeed(this: EnemyGameObj) {
    let multiplier = 1;

    for (const key in this.speedMultipliers) {
        multiplier *= (this.speedMultipliers as Record<string, number>)[key];
    }

    this.speed = this.baseSpeed * multiplier;
}