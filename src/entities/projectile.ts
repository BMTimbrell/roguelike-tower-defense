import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import makeFloatingText from './FloatingText';
import { CRIT_DAMAGE_NUMBER_SIZE, CURSE_CRIT, DAMAGE_NUMBER_SIZE, ELEMENTS, PROJECTILES, TILE_SIZE, type ProjectileId } from '../constants';
import type { ElementName, EnemyGameObj, ProjectileBehavior, ProjectileDef } from '../types';
import { findNewTarget, isValidTarget, selectBounceTarget, selectTarget, shortestAngleDiff } from '../utils/targetingHelpers';
import calcDamage from '../utils/calcDamage';

export default function makeProjectile(k: KAPLAYCtx, opts: {
    id: ProjectileId;
    pos: Vec2;
    target: EnemyGameObj | null;
    damage: number;
    crit?: boolean;
    angle?: number;
    homing: boolean;
    homingDelay?: number;
    turnSpeed?: number;
    element: ElementName;
    behaviors?: ProjectileBehavior;
}): GameObj {
    const { pos, id, element, homing, homingDelay, turnSpeed, behaviors } = opts;
    let crit = opts.crit;
    let { damage, target } = opts;
    const { sprite, speed, splashRadius } = PROJECTILES[id];
    const anim = (PROJECTILES[id] as ProjectileDef).anim ? (PROJECTILES[id] as ProjectileDef).anim : null;

    const projectile = k.add([
        k.sprite(sprite, { ...(anim ? { anim } : {}) }),
        k.anchor("center"),
        k.pos(pos),
        k.rotate(opts.angle ?? 0),
        {
            splashRadius: splashRadius,
            speed,
            homing,
            homingDelay: homingDelay ?? 0,
            turnSpeed: turnSpeed ?? 0
        },
        k.offscreen({ destroy: true }),
        k.z(9999)
    ]);

    let timeAlive = 0;
    let distance = 0;
    let direction = k.Vec2.fromAngle(projectile.angle + 180);
    let willBounce = behaviors?.bounceChance ? Math.random() < behaviors.bounceChance : true;
    let remainingBounces = behaviors?.bounces ?? 0;
    let distanceDamageMultiplier = behaviors?.distanceDamageMultiplier ?? 0;
    let baseDamage = damage;
    let attackTimer = behaviors?.persistent ? 0 : null;
    const hitEnemies = new Set<EnemyGameObj>();
    projectile.onDestroy(() => {
        if (behaviors?.persistent) {
            behaviors.persistent.owner.activeProjectile = null;
        }
    });

    projectile.onUpdate(() => {
        const persistentAndEnemyOutOfRange = target && behaviors?.persistent?.owner && behaviors.persistent.origin.dist(target.pos) > (behaviors.persistent.owner.stats.range + 1) * TILE_SIZE;
        if (homing && (!target || !isValidTarget(target) || persistentAndEnemyOutOfRange)) {
            const origin = behaviors?.persistent ? behaviors.persistent.origin : projectile.pos;

            target = behaviors?.persistent ? selectTarget(k.get("enemy") as EnemyGameObj[], behaviors.persistent.owner, origin) : findNewTarget(k, origin);
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
                    const dist = dir.len();

                    projectile.angle = projectile.pos.angle(towerPos);
                    projectile.pos = projectile.pos.add(
                        dir.unit().scale(projectile.speed * k.dt())
                    );

                    // Arrived
                    if (dist < 4) {
                        k.destroy(projectile);
                    }

                    return;
                }
            }

            // snap direction to new target immediately
            projectile.angle = projectile.pos.angle(target.pos);
            direction = target.pos.sub(projectile.pos).unit();
        }

        if (behaviors?.persistent?.state === "attached") {
            projectile.pos = target?.pos ?? projectile.pos;
        } else projectile.pos = projectile.pos.add(direction.scale(projectile.speed * k.dt()));
        timeAlive += k.dt();

        if (behaviors?.distanceDamageCap && behaviors.distanceDamageCap > distanceDamageMultiplier) {
            distance += k.dt() * speed;
            const distanceTiles = distance / TILE_SIZE;
            distanceDamageMultiplier = Math.min(distanceTiles * 0.05, behaviors.distanceDamageCap);
            damage = Math.round(baseDamage + baseDamage * distanceDamageMultiplier);
        }

        // delay angle change for volley
        if (homing && target && timeAlive >= projectile.homingDelay) {
            const desired = projectile.pos.angle(target.pos);

            const diff = shortestAngleDiff(projectile.angle, desired);
            projectile.angle += diff * Math.min(1, projectile.turnSpeed * k.dt());
            direction = target.pos.sub(projectile.pos).unit();
        }

        // damage enemy when close enough
        if (target && projectile.pos.dist(target.pos) < 4) {
            // attach to enemy if persistent projectile
            if (behaviors?.persistent?.state === "flying") {
                behaviors.persistent.state = "attached";
            }

            if (attackTimer !== null) attackTimer -= k.dt();
            if (!target.isDying && (behaviors?.persistent?.state !== "attached" || (attackTimer !== null && attackTimer <= 0))) {
                if (behaviors?.persistent) {
                    const owner = behaviors.persistent.owner;
                    const { isCrit, damage: newDamage } = calcDamage({
                        bonusDamage: 0,
                        bonusCritChance: target.has("curse") ? CURSE_CRIT : 0,
                        critChance: owner.stats.critChance,
                        critDamage: owner.stats.critDamage,
                        damage: owner.stats.damage
                    });
                    crit = isCrit;
                    damage = newDamage;
                }

                target.hurt(damage);
                makeFloatingText(k, {
                    pos: projectile.pos,
                    text: '' + damage,
                    size: crit ? CRIT_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
                    color: ELEMENTS[element].color
                });

                ELEMENTS[element].applyEffect?.(k, { target, damage });

                if (attackTimer !== null && behaviors?.persistent?.owner) attackTimer += behaviors.persistent.owner.stats.fireInterval;
            }

            if (remainingBounces > 0 && willBounce) {
                remainingBounces--;
                hitEnemies.add(target);
                willBounce = behaviors?.bounceChance ? Math.random() < behaviors.bounceChance : true;

                const nextTarget = selectBounceTarget(k, target, { bounceRange: behaviors?.bounceRange, visited: hitEnemies });

                if (nextTarget) {
                    target = nextTarget;
                    projectile.angle = projectile.pos.angle(target.pos);

                    // only change damage for first bounce
                    if (remainingBounces === (behaviors?.bounces ?? 0) - 1) {
                        damage *= behaviors?.bounceDamageMultiplier ?? 1;
                        baseDamage *= behaviors?.bounceDamageMultiplier ?? 1;
                        baseDamage = Math.round(baseDamage);
                        damage = Math.round(damage);
                    }

                    return;
                }
            }

            if (!behaviors?.persistent) k.destroy(projectile);
        }
    });

    return projectile;
}