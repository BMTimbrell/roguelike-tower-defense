import { type KAPLAYCtx, type Vec2, type GameObj } from 'kaplay';
import { store, gameStateAtom } from '../store';
import type { EnemyId, ProjectileId } from '../constants';
import { ENEMIES, HARD_HEALTH_MULT, STUN_DURATION, TILE_SIZE, TOWER_RANGE_TOLERANCE } from '../constants';
import healthBar from '../kaplayComponents/healthBar';
import statusEffect from '../kaplayComponents/statusEffect';
import type { EnemyConfig, EnemyGameObj, presentSpawns, TowerGameObj } from '../types';
import makeEnemyProjectile from './EnemyProjectile';
import { aoeBurst } from '../utils/makeUnitCombat';
import { waitScaled } from '../utils/timerFunctions';
import { lifespan } from '../kaplayComponents/lifespan';
import { playSfx } from '../utils/soundHelpers';

export default function makeEnemy(
    k: KAPLAYCtx,
    enemyId: EnemyId,
    waypoints: Vec2[],
    pathIndex: number = 0,
    pos?: Vec2,
    stopIndexes?: number[]
) {
    const difficulty = store.get(gameStateAtom).difficulty;
    const waveNumber = store.get(gameStateAtom).waveNumber;

    // const expertWaveMultiplier =
    //     difficulty === "expert" && waveNumber >= 5
    //         ? waveNumber - 4
    //         : 0;

    // const speedMultiplier = 1 + expertWaveMultiplier * 0.015;
    // const healthMultiplier = 1 + expertWaveMultiplier * 0.025;
    const expertBossHealthMult = "isBoss" in ENEMIES[enemyId] && ENEMIES[enemyId].isBoss && difficulty === "expert" ? 1.1 : 1;
    const health = Math.round(getHPAndArmour(ENEMIES[enemyId].hp, waveNumber) * (difficulty !== "normal" ? HARD_HEALTH_MULT : 1) * expertBossHealthMult);

    const baseSpeed = getEnemySpeed(ENEMIES[enemyId].speed, waveNumber);

    const armour = (ENEMIES[enemyId] as Record<"armour", number>).armour
        ? Math.round(getHPAndArmour((ENEMIES[enemyId] as Record<"armour", number>).armour, waveNumber) * (difficulty === "hard" ? 1.2 : 1))
        : 0;

    const enemy: EnemyGameObj = k.add([
        k.pos(pos ?? waypoints[pathIndex]),
        k.sprite(ENEMIES[enemyId].sprite, { anim: "move" }),
        k.anchor("center"),
        k.area({
            shape: new k.Rect(k.vec2(0), 16, 16)
        }),
        k.rotate(),
        k.opacity(1),
        k.health(health, health),
        {
            path: waypoints,
            pathIndex,
            segmentStart: waypoints[0],
            segmentProgress: 0,
            baseSpeed: baseSpeed,
            speed: baseSpeed,
            damage: ENEMIES[enemyId].damage,
            isDying: false,
            armour: armour,
            maxArmour: armour,
            ...("healer" in ENEMIES[enemyId] ? { healer: ENEMIES[enemyId].healer as { amount: number; range: number; }, healTickRate: 2 } : {}),
            ...("spawnOnDeath" in ENEMIES[enemyId] ? { spawnOnDeath: ENEMIES[enemyId].spawnOnDeath as { id: "slime"; amount: number; offset?: number; } } : {}),
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
                    reachedStopIndex: false,
                    presentDropIndex: 0,
                    ...("bossMechanic" in ENEMIES[enemyId] ? { bossMechanic: ENEMIES[enemyId].bossMechanic as "shield" | "escape" } : {})
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
            ...("checkpointTimer" in ENEMIES[enemyId] ? {
                checkpointTimer: ENEMIES[enemyId].checkpointTimer as number,
                checkpointDuration: ENEMIES[enemyId].checkpointTimer as number
            } : {}),
            ...("shieldHp" in ENEMIES[enemyId] ? {
                shieldHp: ENEMIES[enemyId].shieldHp as number,
                maxShieldHp: ENEMIES[enemyId].shieldHp as number
            } :
                {}),
            ...("spawnIce" in ENEMIES[enemyId] ? { spawnIce: ENEMIES[enemyId].spawnIce as boolean } : {}),
            ...("hasLargeSoul" in ENEMIES[enemyId] ? { hasLargeSoul: ENEMIES[enemyId].hasLargeSoul as boolean } : {}),
            ...("shieldSprite" in ENEMIES[enemyId] ? { shieldSprite: ENEMIES[enemyId].shieldSprite as string } : {}),
            ...("shootSound" in ENEMIES[enemyId] ? { shootSound: ENEMIES[enemyId].shootSound as string } : {}),
            speedMultipliers: {
                chill: 1,
                boost: 1,
                wind: 1,
                ice: 1
            }
        },
        k.state("move", ["move", "stunned", "attack", "idle", "escape", "hidden", "shield"]),
        statusEffect(),
        k.z(1),
        "enemy",
        "isBoss" in ENEMIES[enemyId] && ENEMIES[enemyId].isBoss ? "boss" : "",
        `${enemyId}-enemy`
    ]);

    enemy.animSpeed = store.get(gameStateAtom).timeScale;

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
        } else if (anim === "escape") {
            enemy.enterState("hidden");
        } else if (anim === "attack") {
            enemy.play("idle");
        }
    });

    enemy.onStateEnter("idle", () => {
        enemy.play("idle");

        if (!store.get(gameStateAtom).waveActive) {
            if ("checkpointTimer" in ENEMIES[enemyId]) {
                enemy.checkpointDuration = ENEMIES[enemyId].checkpointTimer as number;
                enemy.checkpointTimer = enemy.checkpointDuration
            }
            if ("shieldHp" in ENEMIES[enemyId]) enemy.maxShieldHp = ENEMIES[enemyId].shieldHp as number;

            attackTimer = 0;
        }
    });

    enemy.onStateUpdate("idle", () => {
        if (!store.get(gameStateAtom).waveActive) {
            enemy.statuses.forEach(s => {
                if (enemy.has(s)) enemy.unuse(s);
            });
        }
    });

    enemy.onStateEnter("move", () => {
        enemy.play("move");
    });

    enemy.onStateEnter("attack", () => {
        enemy.play("idle");
    });

    enemy.onStateUpdate("hidden", () => {
        if (!store.get(gameStateAtom).waveActive) {
            enemy.invincible = false;
            enemy.hidden = false;
            enemy.enterState("idle");
        }
    });

    enemy.onStateEnter("stunned", () => {
        playSfx(k, "dizzy");

        enemy.stunResistance = true;
        enemy.stunResistanceTimer = enemy.stunResistanceDuration;

        enemy.play("idle");
        const dizzyEffect = k.add([
            k.sprite("dizzy", { anim: "dizzy" }),
            k.anchor("center"),
            k.pos(enemy.pos),
            k.z(999),
            `dizzy ${enemy.id}`
        ]);
        waitScaled(k, STUN_DURATION, () => {
            k.destroy(dizzyEffect);
            if (enemy?.boss?.reachedStopIndex) enemy.enterState("attack");
            else enemy.enterState("move");
        });
    });

    let healTimer = enemy.healTickRate ?? 0;
    let attackTimer = 0;
    let dir = k.vec2(0);

    // attack for boss
    enemy.onStateUpdate("attack", () => {
        if (!store.get(gameStateAtom).waveActive) enemy.enterState("idle");

        const timeScale = store.get(gameStateAtom).timeScale;
        if (enemy.stunResistanceTimer > 0) {
            enemy.stunResistanceTimer -= k.dt() * timeScale;
        } else enemy.stunResistance = false;

        if (enemy.checkpointTimer) {
            enemy.checkpointTimer -= k.dt() * timeScale;
            if (enemy.checkpointTimer <= 0) {
                enemy.checkpointTimer = enemy.checkpointDuration;
                if (enemy.boss?.bossMechanic === "escape") enemy.enterState("escape");
                if (enemy.boss?.bossMechanic === "shield") enemy.enterState("shield");
            }
        }

        if (attackTimer > enemy.attacker!.attackCooldown) attackTimer = enemy.attacker!.attackCooldown;

        if (attackTimer > 0) {
            attackTimer -= k.dt() * timeScale;
        }

        while (attackTimer <= 0) {
            const towers = (k.get("tower") as TowerGameObj[]).filter(
                t => t.placed && t.name !== "Farm Tower" && enemy.pos.dist(t.pos.add((t.footprint.w * TILE_SIZE) / 2, (t.footprint.h * TILE_SIZE) / 2)) <= enemy.attacker!.attackRange * TILE_SIZE
            );
            if (!towers.length) break;

            const index = k.randi(towers.length);

            if (enemy.shootSound) playSfx(k, enemy.shootSound);

            makeEnemyProjectile(k, {
                id: enemy.attacker!.projectile as ProjectileId,
                pos: enemy.pos,
                target: towers[index],
                hitChance: enemy.has("blind") ? 0.3 : 1
            });

            if (enemy.hasAnim("attack")) enemy.play("attack");
            attackTimer += enemy.attacker!.attackCooldown;
        }
    });

    enemy.onStateEnter("escape", () => {
        enemy.angle = 0;
        enemy.play("escape");
    });

    enemy.onStateUpdate("escape", () => {
        enemy.statuses.forEach(s => {
            if (enemy.has(s)) enemy.unuse(s);
        });
    });

    enemy.onStateEnter("hidden", () => {
        enemy.invincible = true;
        enemy.hidden = true;

        attackTimer = 0;

        enemy.statuses.forEach(s => {
            if (enemy.has(s)) enemy.unuse(s);
        });
    });

    enemy.onStateEnter("shield", () => {
        enemy.play("idle");
        enemy.shieldHp = enemy.maxShieldHp;

        const shieldSound = (ENEMIES[enemyId] as { shieldSound: string }).shieldSound;

        if (shieldSound) playSfx(k, shieldSound);

        enemy.statuses.forEach(s => {
            if (enemy.has(s)) enemy.unuse(s);
        });
        k.add([
            k.sprite(enemy.shieldSprite ?? "slime shield"),
            k.anchor("center"),
            k.pos(enemy.pos),
            k.z(999999),
            "shield"
        ]);

        const barWidth = 64;
        const barHeight = 5;

        const shieldBar = k.add([
            k.rect(barWidth, barHeight),
            k.color(70, 70, 70),
            k.pos(enemy.pos.sub(enemy.width / 4, enemy.height / 4)),
            k.z(999999),
            k.opacity(1),
            k.outline(1, k.BLACK),
            "shieldBar"
        ]);

        k.add([
            k.rect(barWidth, barHeight),
            k.color(k.Color.fromHex("#5ba675")),
            k.pos(shieldBar.pos),
            k.opacity(1),
            k.z(999999),
            "shieldHealth"
        ]);
    });

    enemy.onStateUpdate("shield", () => {
        if (enemy.shieldHp && enemy.maxShieldHp)
            k.get("shieldHealth")[0].width = (enemy.shieldHp / enemy.maxShieldHp) * k.get("shieldBar")[0].width;

        enemy.statuses.forEach(s => {
            if (enemy.has(s)) enemy.unuse(s);
        });
        if (!store.get(gameStateAtom).waveActive) enemy.enterState("idle");
        if (!enemy.shieldHp || enemy.shieldHp <= 0) {
            if (enemy.maxShieldHp) {
                enemy.maxShieldHp *= 2;
                if (enemy.checkpointDuration !== undefined) enemy.checkpointDuration = Math.max(2, enemy.checkpointDuration / 2);
            }
            enemy.enterState("attack");
        }
    });

    enemy.onStateEnd("shield", () => {
        k.destroy(k.get("shield")[0]);

        const bar = k.get("shieldBar")[0];
        const barHealth = k.get("shieldHealth")[0];

        bar.onUpdate(() => {
            bar.opacity -= k.dt() * store.get(gameStateAtom).timeScale;
        });

        barHealth.onUpdate(() => {
            barHealth.opacity -= k.dt() * store.get(gameStateAtom).timeScale;
        });

        waitScaled(k, 0.5, () => {
            k.destroy(bar);
            k.destroy(barHealth);
        })
    });

    enemy.onStateUpdate("move", () => {
        const timeScale = store.get(gameStateAtom).timeScale;
        if (enemy.isDying) return;

        if (enemy.invincibleCooldown && enemy.invincibleTimer > 0) {
            enemy.invincibleTimer -= k.dt() * timeScale;
            if (enemy.invincibleTimer <= 0) enemy.invincible = true;
        }

        if (enemy.invincible) {
            enemy.invincibleDuration -= k.dt() * timeScale;
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
            enemy.stunResistanceTimer -= k.dt() * timeScale;
        } else enemy.stunResistance = false;

        if (enemy.attacker && attackTimer > enemy.attacker!.attackCooldown) attackTimer = enemy.attacker!.attackCooldown;

        if (enemy.attacker && attackTimer > 0) attackTimer -= k.dt() * timeScale;

        enemy.z = enemy.pos.y + enemy.pos.x * 0.0001 * (dir.x > 0 ? 1 : -1);

        // boss
        if (enemy.boss && enemy.boss.stopIndexes.length) {
            const stopIndex = enemy.boss.stopIndexes[enemy.boss.currentStopIndex];

            if (enemy.pathIndex >= stopIndex) {
                enemy.boss.reachedStopIndex = true;
                enemy.angle = 0;
                enemy.enterState("attack");
                return;
            }
        }

        const drops = (ENEMIES[enemyId] as EnemyConfig).presentDrops;

        const drop = drops?.[(enemy?.boss?.presentDropIndex) ?? 0];

        if (
            drop &&
            enemy.boss &&
            enemy.pathIndex === drop.segment &&
            enemy.segmentProgress >= drop.segmentProgress
        ) {
            const start = enemy.segmentStart;
            const end = enemy.path[enemy.pathIndex + 1];

            const pos = start.lerp(end, drop.segmentProgress);

            spawnPresent(k, pos, drop.enemies.map(e => ({ ...e, path: enemy.path, pathIndex: enemy.pathIndex })));

            enemy.boss.presentDropIndex++;
        }

        const next = enemy.path[enemy.pathIndex + 1];
        if (!next) {
            if (enemy.pathIndex >= enemy.path.length - 1) {
                k.destroy(enemy);
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    health: prev.health - enemy.damage
                }));

                if (store.get(gameStateAtom).health <= 0) {
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gameOver: true
                    }));
                }
            }
            return;
        }

        dir = next.sub(enemy.pos).unit();
        enemy.pos = enemy.pos.add(dir.scale(enemy.speed * k.dt() * timeScale));

        enemy.angle = dirToRotation(dir);

        const segmentLen = enemy.segmentStart.dist(next);
        const traveled = enemy.pos.dist(enemy.segmentStart);

        enemy.segmentProgress = segmentLen > 0
            ? traveled / segmentLen
            : 1;

        if (enemy.pos.dist(next) <= (enemy.speed * k.dt() * timeScale)) {
            enemy.pathIndex++;
            enemy.segmentStart = enemy.path[enemy.pathIndex];
            enemy.segmentProgress = 0;

            if (enemy.pathIndex >= enemy.path.length - 1) {
                k.destroy(enemy);
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    health: prev.health - enemy.damage
                }));

                if (store.get(gameStateAtom).health <= 0) {
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gameOver: true
                    }));
                }
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

                if (enemy.shootSound) playSfx(k, enemy.shootSound);

                makeEnemyProjectile(k, {
                    id: enemy.attacker!.projectile as ProjectileId,
                    pos: enemy.pos,
                    target: towers[index],
                    hitChance: enemy.has("blind") ? 0.3 : 1
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

        // speed in wind zone
        const winds = k.get("wind");

        let windMultiplier = 1;

        for (const wind of winds) {
            if (enemy.pos.x > wind.pos.x &&
                enemy.pos.x < wind.pos.x + wind.width &&
                enemy.pos.y > wind.pos.y &&
                enemy.pos.y < wind.pos.y + wind.height) {

                const isHorizontal = Math.abs(dir.x) > Math.abs(dir.y);

                if (isHorizontal) {
                    const movingRight = dir.x > 0;

                    if (wind.direction === "east") {
                        windMultiplier = movingRight ? 1.6 : 0.75;
                    } else if (wind.direction === "west") {
                        windMultiplier = !movingRight ? 1.6 : 0.75;
                    }
                } else {
                    windMultiplier = 1;
                }

                break;
            }
        }

        if (enemy.speedMultipliers.wind !== windMultiplier) {
            enemy.speedMultipliers.wind = windMultiplier;
            updateSpeed.call(enemy);
        }


        // healing enemies if healer
        if (!enemy.healer && !enemy.healTickRate) return;

        healTimer -= k.dt() * timeScale;

        while (healTimer <= 0) {
            const circleEffect = k.add([
                k.circle(2, { fill: false }),
                k.color(),
                k.outline(1, k.rgb(0, 255, 0)),
                k.anchor("center"),
                k.pos(enemy.pos),
                lifespan(k, 0.5),
                k.opacity(1),
                k.scale(1),
                {
                    update() {
                        circleEffect.radius += k.dt() * timeScale * 90;
                        circleEffect.opacity -= k.dt() * timeScale * 0.5;
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
        let t = 0;
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
                    const timeScale = store.get(gameStateAtom).timeScale;
                    t += k.dt() * timeScale;
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
        })
    }

    enemy.onDeath(() => {
        if (enemy.isDying) return;

        const deathSound = (ENEMIES[enemyId] as { deathSound: string }).deathSound;
        if (deathSound) playSfx(k, deathSound, enemy.boss || enemy.hasLargeSoul ? 1 : 0.5);

        k.trigger("enemyDeath", "ghost", { pos: enemy.pos, enemy, soulClaimed: false });

        if (enemyId === "polarBearJockey" || enemyId === "giantPolarBearJockey") enemy.z = 0;

        const dizzyEffect = k.get(`dizzy ${enemy.id}`)[0];
        if (dizzyEffect) k.destroy(dizzyEffect);

        if (enemy.spawnOnDeath) {

            const mid = enemy.spawnOnDeath.amount / 2;

            for (let i = 0; i < enemy.spawnOnDeath.amount; i++) {
                const posOffset = (i - mid) *  (enemy.spawnOnDeath.offset ?? 12);
                const posOffsetX = Math.abs(dir.x) > 0.5 ? posOffset : 0;
                const posOffsetY = Math.abs(dir.y) > 0.5 ? posOffset : 0;

                const spawnedEnemy = makeEnemy(k,
                    enemy.spawnOnDeath.id,
                    enemy.path,
                    enemy.pathIndex,
                    k.vec2(enemy.pos).add(posOffsetX, posOffsetY)
                );

                spawnedEnemy.invincible = true;
                spawnedEnemy.invincibleDuration = 0.05;
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
                lifespan(k, 2),
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

function spawnPresent(k: KAPLAYCtx, pos: Vec2, enemiesToSpawn: {
    id: presentSpawns;
    amount: number;
    path: Vec2[];
    pathIndex: number;
}[]) {
    const present = k.add([
        k.pos(pos),
        k.anchor("center"),
        k.sprite("present", { anim: "idle" })
    ]);

    present.onAnimEnd(anim => {
        if (anim === "open") k.destroy(present);
    });

    waitScaled(k, 5, () => {

        present.play("open");

        playSfx(k, "present tear");

        enemiesToSpawn.forEach(group => {
            const mid = group.amount / 2;

            for (let i = 0; i < group.amount; i++) {
                const posOffset = (i - mid) * 12;
                const spawnedEnemy = makeEnemy(k, group.id, group.path, group.pathIndex, present.pos.add(posOffset));
                spawnedEnemy.invincible = true;
                spawnedEnemy.invincibleDuration = 0.1;
            }
        });
    });
}

function getHPAndArmour(baseHp: number, wave: number) {
    let hp = baseHp;

    for (let i = 2; i <= wave; i++) {
        let growthRate = 0;

        if (i === 2) growthRate = 0.02;
        else if (i === 3) growthRate = 0.03;
        else if (i === 4) growthRate = 0.05;
        else if (i === 5) growthRate = 0.07;
        else if (i === 6) growthRate = 0.1;
        else if (i === 7) growthRate = 0.15;
        else growthRate = 0.2;

        hp *= 1 + growthRate;
    }

    return hp;
}

function getEnemySpeed(baseSpeed: number, wave: number) {
    let speed = baseSpeed;

    for (let i = 2; i <= wave; i++) {
        let growthRate = 0;

        if (i > 1) growthRate = 0.01;

        speed *= 1 + growthRate;
    }

    return speed;
}