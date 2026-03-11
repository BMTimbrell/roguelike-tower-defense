import type { KAPLAYCtx, Vec2 } from "kaplay";
import { TILE_SIZE, type ProjectileId } from "../constants";
import type { HeroGameObj, TowerGameObj } from "../types";

export default function makeEnemyProjectile(k: KAPLAYCtx, opts: {
    id: ProjectileId;
    pos: Vec2;
    target: TowerGameObj | HeroGameObj;
}) {
    const { id, pos, target } = opts;

    const projectile = k.add([
        k.sprite(id),
        k.pos(pos),
        k.anchor("center"),
        k.offscreen({ destroy: true }),
        {
            speed: 200
        },
        k.z(9999)
    ]);

    const targetPos = target.pos.add((target.footprint.w * TILE_SIZE) / 2, (target.footprint.h * TILE_SIZE) / 2);

    projectile.onUpdate(() => {
        const dir = targetPos.sub(projectile.pos).unit();

        projectile.pos = projectile.pos.add(dir.scale(projectile.speed * k.dt()));

        if (projectile.pos.dist(targetPos) < 4) {
            const duration = 2;

            target.disabledUntil = Math.max(
                target.disabledUntil,
                k.time() + duration
            );

            target.enterState("disabled");

            k.destroy(projectile);
        }
    });

}