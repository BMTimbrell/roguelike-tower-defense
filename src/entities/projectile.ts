import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';

export default function makeProjectile(k: KAPLAYCtx, pos: Vec2, target: GameObj): GameObj {
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
            target.hurt(1);
            k.destroy(projectile);
        }
    });

    return projectile;
}