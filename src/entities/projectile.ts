import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import makeFloatingText from './FloatingText';
import { CRIT_DAMAGE_NUMBER_COLOR, CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_COLOR, DAMAGE_NUMBER_SIZE, ELEMENTS, PROJECTILES, TILE_SIZE, type ProjectileId } from '../constants';
import type { ElementName, ProjectileBehavior } from '../types';
import { shortestAngleDiff } from '../utils/targetingHelpers';

export default function makeProjectile(k: KAPLAYCtx, opts: {
    id: ProjectileId;
    pos: Vec2;
    target: GameObj;
    damage: number;
    crit?: boolean;
    angle?: number;
    homing: boolean;
    homingDelay?: number;
    turnSpeed?: number;
    element: ElementName;
    behaviors?: ProjectileBehavior;
}): GameObj {
    const { pos, crit = false, id, element, homing, homingDelay, turnSpeed, behaviors } = opts;
    let { damage, target } = opts;
    const { sprite, speed, splashRadius } = PROJECTILES[id];

    const projectile = k.add([
        k.sprite(sprite),
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
        k.offscreen({ destroy: true })
    ]);

    let timeAlive = 0;
    let distance = 0;
    let direction = k.Vec2.fromAngle(projectile.angle + 180);
    let remainingBounces = behaviors?.bounces ?? 0;
    let distanceDamageMultiplier = behaviors?.distanceDamageMultiplier ?? 0;
    let baseDamage = damage;

    projectile.onUpdate(() => {
        projectile.pos = projectile.pos.add(direction.scale(projectile.speed * k.dt()));
        timeAlive += k.dt();

        if (behaviors?.distanceDamageCap && behaviors.distanceDamageCap > distanceDamageMultiplier) {
            distance += k.dt() * speed;
            const distanceTiles = distance / TILE_SIZE;
            distanceDamageMultiplier = Math.min(distanceTiles * 0.05, behaviors.distanceDamageCap);
            damage = Math.round(baseDamage + baseDamage * distanceDamageMultiplier);
        }

        if (homing && target && timeAlive >= projectile.homingDelay) {
            const desired = projectile.pos.angle(target.pos);

            const diff = shortestAngleDiff(projectile.angle, desired);
            projectile.angle += diff * Math.min(1, projectile.turnSpeed * k.dt());
            direction = target.pos.sub(projectile.pos).unit();
        }

        if (projectile.pos.dist(target.pos) < 4) {
            target.hurt(damage);
            makeFloatingText(k, {
                pos: projectile.pos,
                text: '' + damage,
                size: crit ? CRIT_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
                color: ELEMENTS[element].color
            });

            if (ELEMENTS[element].applyEffect) {
                ELEMENTS[element].applyEffect!(k, target);
            }

            if (remainingBounces > 0) {
                remainingBounces--;

                const nextTarget = selectBounceTarget(k, target, behaviors?.bounceRange);

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

            k.destroy(projectile);
        }
    });

    return projectile;
}

function selectBounceTarget(k: KAPLAYCtx, from: GameObj, bounceRange?: number) {
    return k
        .get("enemy")
        .filter(e =>
            e !== from &&
            e.pos.dist(from.pos) <= (bounceRange ?? 0)
        )
        .sort((a, b) =>
            a.pos.dist(from.pos) - b.pos.dist(from.pos)
        )[0];
}