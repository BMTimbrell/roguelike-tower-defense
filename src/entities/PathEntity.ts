import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { ElementName, EnemyGameObj } from "../types";
import hurtEnemy from "../utils/hurtEnemy";
import calcDamage from "../utils/calcDamage";
import { CURSE_CRIT, PROJECTILES, TILE_SIZE, type ProjectileId } from "../constants";
import { gameStateAtom, store } from "../store";

export default function makePathEntity(
    k: KAPLAYCtx,
    opts: {
        ownerId: string;
        from: Vec2;
        targetPos: Vec2;
        damage: number;
        damageMultiplier: number;
        critChance: number;
        critDamage: number;
        element: ElementName;
        projectileId: ProjectileId;
    }
) {
    const { from, targetPos, critChance, critDamage, element, ownerId, projectileId } = opts;
    const sprite = PROJECTILES[projectileId].sprite;

    const entity = k.add([
        k.sprite(sprite),
        k.anchor("center"),
        k.pos(from),
        {
            ownerId,
        },
        "pathEntity"
    ]);

    entity.animSpeed = store.get(gameStateAtom).timeScale;

    let pathEntity: GameObj | null = null;
    const splashRadius = PROJECTILES[projectileId].splashRadius * TILE_SIZE;

    let prevPos = entity.pos.clone();
    const hitRadius = 4;

    entity.onUpdate(() => {
        const timeScale = store.get(gameStateAtom).timeScale;
        const direction = targetPos.sub(entity.pos).unit();
        entity.pos = entity.pos.add(direction.scale(200 * k.dt() * timeScale));

        const seg = entity.pos.sub(prevPos);
        const toEnemy = targetPos.sub(prevPos);

        const segLenSq = seg.dot(seg);
        const t = segLenSq === 0 ? 0 : toEnemy.dot(seg) / segLenSq;
        const closest = prevPos.add(seg.scale(Math.max(0, Math.min(1, t))));
        const hit = closest.dist(targetPos) < hitRadius;

        if (hit) {
            pathEntity = k.add([
                k.sprite(sprite),
                k.pos(entity.pos),
                k.anchor("center"),
                {
                    ownerId,
                    update() {
                        const enemies = k.get("enemy") as EnemyGameObj[];

                        enemies.forEach(e => {
                            if (!e.invincible && pathEntity?.pos.dist(e.pos) < 10) {
                                if (splashRadius) {
                                    enemies.forEach(enemy => {
                                        if (pathEntity?.pos.dist(enemy.pos) < splashRadius) {
                                            const { isCrit, damage } = calcDamage({
                                                bonusDamage: 0,
                                                bonusCritChance: enemy.has("curse") ? CURSE_CRIT + (k.get("hero")[0]?.hasCurseBuff ? 10 : 0) : 0,
                                                critChance: critChance,
                                                critDamage: critDamage,
                                                damage: opts.damage,
                                                damageMultiplier: opts.damageMultiplier
                                            });

                                            hurtEnemy(k, {
                                                target: enemy,
                                                damage,
                                                isCrit,
                                                element
                                            });
                                        }
                                    });
                                } else {
                                    const { isCrit, damage } = calcDamage({
                                        bonusDamage: 0,
                                        bonusCritChance: e.has("curse") ? CURSE_CRIT + (k.get("hero")[0]?.hasCurseBuff ? 10 : 0) : 0,
                                        critChance: critChance,
                                        critDamage: critDamage,
                                        damage: opts.damage,
                                        damageMultiplier: opts.damageMultiplier
                                    });

                                    hurtEnemy(k, {
                                        target: e,
                                        damage,
                                        isCrit,
                                        element
                                    });
                                }

                                pathEntity && k.destroy(pathEntity);
                                return;
                            }
                        });
                    }
                },
                "pathEntity"
            ]);

            pathEntity.onDestroy(() => {
                if (splashRadius) {
                    const explosion = k.add([
                        k.sprite(sprite, { anim: "explode" }),
                        k.anchor("center"),
                        k.pos(entity.pos)
                    ]);

                    explosion.animSpeed = timeScale;

                    explosion.onAnimEnd(() => k.destroy(explosion));
                }
            });

            k.destroy(entity);
        }

        prevPos = entity.pos.clone();
    });

}