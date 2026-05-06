import type { KAPLAYCtx, Vec2 } from "kaplay";
import { PROJECTILES, TILE_SIZE, type ProjectileId } from "../constants";
import type { HeroGameObj, TowerGameObj } from "../types";
import makeFloatingText from "./FloatingText";
import { gameStateAtom, store } from "../store";

export default function makeEnemyProjectile(k: KAPLAYCtx, opts: {
    id: ProjectileId;
    pos: Vec2;
    target: TowerGameObj | HeroGameObj;
    hitChance: number;
}) {
    const { id, pos, target, hitChance } = opts;

    const projectile = k.add([
        k.sprite(PROJECTILES[id].sprite),
        k.pos(pos),
        k.anchor("center"),
        k.rotate(0),
        k.offscreen({ destroy: true }),
        {
            speed: 200
        },
        k.z(9999)
    ]);

    projectile.animSpeed = store.get(gameStateAtom).timeScale;

    const targetPos = target.pos.add((target.footprint.w * TILE_SIZE) / 2, (target.footprint.h * TILE_SIZE) / 2);

    let prevPos = projectile.pos.clone();

    projectile.onUpdate(() => {
        const timeScale = store.get(gameStateAtom).timeScale;
        const hitRadius = 4;
        const dir = targetPos.sub(projectile.pos).unit();
        projectile.angle = projectile.pos.angle(targetPos);

        projectile.pos = projectile.pos.add(dir.scale(projectile.speed * k.dt() * timeScale));

        const seg = projectile.pos.sub(prevPos);
        const toEnemy = targetPos.sub(prevPos);

        const segLenSq = seg.dot(seg);
        const t = segLenSq === 0 ? 0 : toEnemy.dot(seg) / segLenSq;
        const closest = prevPos.add(seg.scale(Math.max(0, Math.min(1, t))));
        const hit = closest.dist(targetPos) < hitRadius;

        if (hit) {
            if (target.hasBlock) {
                makeFloatingText(k, {
                    text: "Block",
                    color: "#FFFFFF",
                    size: 12,
                    pos: targetPos
                });
            } else if (Math.random() < hitChance) {
                const duration = 2;

                target.disabledTimeLeft = Math.max(
                    target.disabledTimeLeft ?? 0,
                    duration
                );

                target.enterState("disabled");

            } else {
                makeFloatingText(k, {
                    text: "Miss",
                    color: "#FFFFFF",
                    size: 12,
                    pos: targetPos
                });
            }

            k.destroy(projectile);
        }

        prevPos = projectile.pos.clone();
    });

    projectile.onDestroy(() => {
        const anim = (PROJECTILES[opts.id] as { anim: string })?.anim;
        if (anim) {
            const animSprite = k.add([
                k.sprite(PROJECTILES[opts.id].sprite, { anim }),
                k.pos(projectile.pos),
                k.z(999),
                k.anchor("center")
            ]);
            animSprite.animSpeed = store.get(gameStateAtom).timeScale;
            animSprite.onAnimEnd(() => k.destroy(animSprite));
        }
    });

}