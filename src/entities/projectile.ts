import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import makeFloatingText from './floatingText';

type projectileParams = { 
    pos: Vec2; 
    target: GameObj;
    damage: number;
    crit?: boolean; 
};

export default function makeProjectile(k: KAPLAYCtx, { pos, target, damage, crit = false }: projectileParams): GameObj {
    const projectile = k.add([
        k.rect(8, 8),
        k.pos(pos),
        k.area({
            shape: new k.Rect(k.vec2(0), 8, 8)
        }),
        k.color(255, 0, 0)
    ]);

    projectile.onUpdate(() => {
        const direction = target.pos.sub(projectile.pos).unit();
        projectile.pos = projectile.pos.add(direction.scale(300 * k.dt()));
        if (projectile.pos.dist(target.pos) < 4) {
            target.hurt(damage);
            makeFloatingText(k, { pos: projectile.pos, text: '' + damage, size: crit ? 18 : 12 });
            k.destroy(projectile);
        }
    });

    return projectile;
}