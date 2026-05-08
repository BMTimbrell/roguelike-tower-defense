import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import { CURSE_CRIT, PROJECTILES, TILE_SIZE, type ProjectileId } from '../constants';
import type { ElementName, EnemyGameObj, ProjectileBehavior, ProjectileDef } from '../types';
import { findNewTarget, isValidTarget, selectBounceTarget, selectTarget, shortestAngleDiff } from '../utils/targetingHelpers';
import calcDamage from '../utils/calcDamage';
import hurtEnemy from '../utils/hurtEnemy';
import getBuffValue from '../utils/getBuffValue';
import { gameStateAtom, store } from '../store';

export default function makeProjectile(k: KAPLAYCtx, opts: {
    id: ProjectileId;
    pos: Vec2;
    target: EnemyGameObj | null;
    damage: number;
    splashRadius: number;
    element: ElementName;
    crit?: boolean;
    angle: number;
    homing: boolean;
    homingDelay?: number;
    turnSpeed?: number;
    behaviors?: ProjectileBehavior;
    scale: number;
}): GameObj {
    const { pos, id, element, homing, homingDelay, turnSpeed, behaviors, splashRadius, scale } = opts;
    let crit = opts.crit;
    let { damage, target } = opts;
    const { sprite, speed } = PROJECTILES[id];
    const noRotate = (PROJECTILES[id] as Record<"noRotate", boolean>)?.noRotate ?? false;

    const anim = (PROJECTILES[id] as ProjectileDef).anim ? (PROJECTILES[id] as ProjectileDef).anim : null;
    const splitDamage = (PROJECTILES[id] as ProjectileDef).splitDamage;

    const projectile = k.add([
        k.sprite(sprite, { ...(anim ? { anim } : {}) }),
        k.anchor("center"),
        k.pos(pos),
        k.rotate(!noRotate ? opts.angle : 0),
        k.scale(scale),
        {
            splashRadius,
            speed,
            homing,
            homingDelay: homingDelay ?? 0,
            turnSpeed: turnSpeed ?? 0
        },
        k.offscreen({ destroy: true }),
        k.z(9999)
    ]);

    projectile.animSpeed = store.get(gameStateAtom).timeScale;

    let timeAlive = 0;
    let distance = 0;
    let direction = k.Vec2.fromAngle(projectile.angle + 180);
    let willBounce = behaviors?.bounceChance ? Math.random() < behaviors.bounceChance : true;
    let remainingBounces = behaviors?.bounces ?? 0;
    let distanceDamageMultiplier = behaviors?.distanceDamageMultiplier ?? 0;
    let baseDamage = damage;
    let attackTimer = behaviors?.persistent ? 0 : null;
    let retargetTimer = 0.2;
    const hitEnemies = new Set<EnemyGameObj>();
    projectile.onDestroy(() => {
        if (behaviors?.persistent) {
            behaviors.persistent.owner.activeProjectile = null;
        }

        if (behaviors?.animOnDestroy) {
            const animSprite = k.add([
                k.sprite(sprite, { anim: behaviors?.animOnDestroy }),
                k.pos(projectile.pos),
                k.z(999),
                k.anchor("center")
            ]);
            animSprite.animSpeed = store.get(gameStateAtom).timeScale;
            animSprite.onAnimEnd(() => k.destroy(animSprite));
        }
    });

    let prevPos = projectile.pos.clone();
    projectile.onUpdate(() => {
        const timeScale = store.get(gameStateAtom).timeScale;
        const hitRadius = 4;
        const persistentAndEnemyOutOfRange = target && behaviors?.persistent?.owner && behaviors.persistent.origin.dist(target.pos) > (behaviors.persistent.owner.stats.range + 1) * TILE_SIZE;

        // delay angle change for volley
        if (homing && target && timeAlive >= projectile.homingDelay) {
            const desired = projectile.pos.angle(target.pos);

            const diff = shortestAngleDiff(projectile.angle, desired);
            projectile.angle += diff * Math.min(1, projectile.turnSpeed * k.dt() * timeScale);
            direction = target.pos.sub(projectile.pos).unit();
        }

        if (homing && (!target || !isValidTarget(target) || persistentAndEnemyOutOfRange)) {
            const origin = behaviors?.persistent ? behaviors.persistent.origin : projectile.pos;

            target = behaviors?.persistent ?
                selectTarget(k.get("enemy") as EnemyGameObj[], behaviors.persistent.owner, origin) :
                findNewTarget(k, origin, 5 * TILE_SIZE);

            if (behaviors?.persistent) behaviors.persistent.state = "flying";

            if (!target) {
                if (!behaviors?.persistent) {
                    k.destroy(projectile);
                    return;
                } else {
                    behaviors.persistent.state = "returning";
                    const towerPos = behaviors.persistent.origin;
                    if (!towerPos) {
                        k.destroy(projectile);
                        return;
                    }

                    const dir = towerPos.sub(projectile.pos);

                    if (!noRotate) projectile.angle = projectile.pos.angle(towerPos);
                    projectile.pos = projectile.pos.add(
                        dir.unit().scale(projectile.speed * k.dt() * timeScale)
                    );

                    // Arrived
                    const seg = projectile.pos.sub(prevPos);
                    const toEnemy = towerPos.sub(prevPos);

                    const segLenSq = seg.dot(seg);
                    const t = segLenSq === 0 ? 0 : toEnemy.dot(seg) / segLenSq;
                    const closest = prevPos.add(seg.scale(Math.max(0, Math.min(1, t))));
                    const hit = closest.dist(towerPos) < hitRadius;
                    if (hit) {
                        k.destroy(projectile);
                    }

                    prevPos = projectile.pos.clone();
                    return;
                }
            }

            // snap direction to new target immediately
            if (!noRotate) projectile.angle = projectile.pos.angle(target.pos);
            direction = target.pos.sub(projectile.pos).unit();
        }

        if (behaviors?.persistent?.state === "attached") {
            projectile.pos = target?.pos ?? projectile.pos;
            retargetTimer -= k.dt() * timeScale;

            if (behaviors?.persistent && retargetTimer <= 0) {
                retargetTimer = 0.2;

                const owner = behaviors.persistent.owner;
                const origin = behaviors.persistent.origin;

                const bestTarget = selectTarget(k.get("enemy") as EnemyGameObj[], owner, origin);

                if (bestTarget && bestTarget !== target) {
                    target = bestTarget;
                    behaviors.persistent.state = "flying";
                    if (!noRotate) projectile.angle = projectile.pos.angle(target.pos);
                    direction = target.pos.sub(projectile.pos).unit();
                }
            }

            if (behaviors.persistent.owner.state === "disabled") k.destroy(projectile);

        } else projectile.pos = projectile.pos.add(direction.scale(projectile.speed * k.dt() * timeScale));
        timeAlive += k.dt() * timeScale;

        if (behaviors?.distanceDamageCap && behaviors.distanceDamageCap > distanceDamageMultiplier) {
            distance += k.dt() * timeScale * speed;
            const distanceTiles = distance / TILE_SIZE;
            distanceDamageMultiplier = Math.min(distanceTiles * (behaviors.damagePerTile ?? 0.05), behaviors.distanceDamageCap);
            damage = Math.round(baseDamage + baseDamage * distanceDamageMultiplier);
        }

        // damage enemy when close enough
        if (target) {
            const seg = projectile.pos.sub(prevPos);
            const toEnemy = target.pos.sub(prevPos);

            const segLenSq = seg.dot(seg);
            const t = segLenSq === 0 ? 0 : toEnemy.dot(seg) / segLenSq;
            const closest = prevPos.add(seg.scale(Math.max(0, Math.min(1, t))));
            const hit = closest.dist(target.pos) < hitRadius;

            if (hit) {
                // attach to enemy if persistent projectile
                if (behaviors?.persistent?.state === "flying") {
                    behaviors.persistent.state = "attached";
                }

                if (attackTimer !== null) attackTimer -= k.dt() * timeScale;
                if (!target.isDying && (behaviors?.persistent?.state !== "attached" || (attackTimer !== null && attackTimer <= 0))) {
                    if (behaviors?.persistent) {
                        const owner = behaviors.persistent.owner;
                        const damageMult = 1 + getBuffValue(owner, "damage");
                        const { isCrit, damage: newDamage } = calcDamage({
                            bonusDamage: 0,
                            bonusCritChance: target.has("curse") ? CURSE_CRIT + (k.get("hero")[0]?.hasCurseBuff ? 10 : 0) : 0,
                            critChance: owner.stats.critChance + (getBuffValue(owner, "critChance") * 100),
                            critDamage: owner.stats.critDamage * (1 + getBuffValue(owner, "critDamage")),
                            damage: owner.stats.damage,
                            damageMultiplier: damageMult
                        });
                        crit = isCrit;
                        damage = newDamage;
                    }

                    if (splashRadius) {

                        const enemies = (k.get("enemy") as EnemyGameObj[])
                            .filter(e =>
                                !e.isDying &&
                                e.pos.dist(projectile.pos) < splashRadius * TILE_SIZE
                            );

                        if (splitDamage) {
                            const exponent = 0.6;

                            const finalDamage = Math.round(damage / Math.pow(enemies.length, exponent));
                            const maxTargets = 5;

                            enemies.sort((a, b) => a.pos.dist(projectile.pos) - b.pos.dist(projectile.pos))
                                .slice(0, maxTargets)
                                .forEach(e => {
                                    hurtEnemy(k, {
                                        target: e,
                                        damage: finalDamage,
                                        isCrit: crit ?? false,
                                        element
                                    });
                                });

                        } else {
                            enemies.forEach(e => {
                                hurtEnemy(k, {
                                    target: e,
                                    damage,
                                    isCrit: crit ?? false,
                                    element
                                });
                            });
                        }


                    } else {

                        hurtEnemy(k, {
                            target,
                            damage,
                            isCrit: crit ?? false,
                            element
                        });

                    }

                    if (attackTimer !== null && behaviors?.persistent?.owner) {
                        const fireRateBuff = getBuffValue(behaviors.persistent.owner, "fireRate");
                        attackTimer += behaviors.persistent.owner.stats.fireInterval * (1 - fireRateBuff);
                    }

                }

                if (remainingBounces > 0 && willBounce) {
                    remainingBounces--;
                    hitEnemies.add(target);
                    willBounce = behaviors?.bounceChance ? Math.random() < behaviors.bounceChance : true;

                    const nextTarget = selectBounceTarget(k, target, { bounceRange: behaviors?.bounceRange, visited: hitEnemies });

                    if (nextTarget) {
                        target = nextTarget;
                        if (!noRotate) projectile.angle = projectile.pos.angle(target.pos);

                        // only change damage for first bounce
                        if (remainingBounces === (behaviors?.bounces ?? 0) - 1) {
                            damage *= behaviors?.bounceDamageMultiplier ?? 1;
                            baseDamage *= behaviors?.bounceDamageMultiplier ?? 1;
                            baseDamage = Math.round(baseDamage);
                            damage = Math.round(damage);
                        }

                        prevPos = projectile.pos.clone();
                        return;
                    }
                }

                if (!behaviors?.persistent || !store.get(gameStateAtom).waveActive) {
                    k.destroy(projectile);
                }
            }
        }
        prevPos = projectile.pos.clone();
    });

    return projectile;
}