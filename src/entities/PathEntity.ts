import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { ElementName, EnemyGameObj } from "../types";
import hurtEnemy from "../utils/hurtEnemy";
import calcDamage from "../utils/calcDamage";
import { CURSE_CRIT, PROJECTILES, TILE_SIZE, type ProjectileId } from "../constants";

export default function makePathEntity(
    k: KAPLAYCtx,
    opts: {
        ownerId: string;
        from: Vec2;
        targetPos: Vec2;
        damage: number;
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

    let pathEntity: GameObj | null = null;
    const splashRadius = PROJECTILES[projectileId].splashRadius * TILE_SIZE;

    entity.onUpdate(() => {
        const direction = targetPos.sub(entity.pos).unit();
        entity.pos = entity.pos.add(direction.scale(200 * k.dt()));

        if (entity.pos.dist(targetPos) < 4) {
            pathEntity = k.add([
                k.sprite(sprite),
                k.pos(entity.pos),
                k.anchor("center"),
                {
                    ownerId,
                    update() {
                        const enemies = k.get("enemy") as EnemyGameObj[];

                        enemies.forEach(e => {
                            if (pathEntity?.pos.dist(e.pos) < 10) {
                                if (splashRadius) {
                                    enemies.forEach(enemy => {
                                        if (pathEntity?.pos.dist(enemy.pos) < splashRadius) {
                                            const { isCrit, damage } = calcDamage({
                                                bonusDamage: 0,
                                                bonusCritChance: enemy.has("curse") ? CURSE_CRIT : 0,
                                                critChance: critChance,
                                                critDamage: critDamage,
                                                damage: opts.damage
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
                                        bonusCritChance: e.has("curse") ? CURSE_CRIT : 0,
                                        critChance: critChance,
                                        critDamage: critDamage,
                                        damage: opts.damage
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

                    explosion.onAnimEnd(() => k.destroy(explosion));
                }
            });

            k.destroy(entity);
        }
    });

}