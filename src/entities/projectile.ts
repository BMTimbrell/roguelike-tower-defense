import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import makeFloatingText from './FloatingText';
import { CRIT_DAMAGE_NUMBER_COLOR, CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_COLOR, DAMAGE_NUMBER_SIZE, ELEMENTS, PROJECTILES, type ProjectileId } from '../constants';
import type { ElementName } from '../types';

export default function makeProjectile(k: KAPLAYCtx, opts: { 
    id: ProjectileId;
    pos: Vec2; 
    target: GameObj;
    damage: number;
    crit?: boolean;
    angle?: number;
    element: ElementName;
}): GameObj {
    const { pos, target, damage, crit = false, id, element } = opts;
    const { sprite, hitbox, speed, splashRadius } = PROJECTILES[id];

    const projectile = k.add([
        k.sprite(sprite),
        k.anchor("center"),
        k.pos(pos),
        k.rotate(opts.angle ?? 0),
        k.area({
            shape: new k.Rect(k.vec2(0), hitbox.width, hitbox.height)
        }),
        {
            splashRadius: splashRadius,
            speed
        }
    ]);

    projectile.onUpdate(() => {
        const direction = target.pos.sub(projectile.pos).unit();
        projectile.pos = projectile.pos.add(direction.scale(projectile.speed * k.dt()));
        if (projectile.pos.dist(target.pos) < 4) {
            target.hurt(damage);
            if (ELEMENTS[element].applyEffect) {
                ELEMENTS[element].applyEffect!(k, target);
            }

            makeFloatingText(k, { 
                pos: projectile.pos, 
                text: '' + damage, 
                size: crit ? CRIT_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
                color: crit ? CRIT_DAMAGE_NUMBER_COLOR : DAMAGE_NUMBER_COLOR
            });

            k.destroy(projectile);
        }
    });

    return projectile;
}