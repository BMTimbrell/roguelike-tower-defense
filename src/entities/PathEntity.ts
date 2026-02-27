import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { ElementName, EnemyGameObj, TowerStats } from "../types";
import hurtEnemy from "../utils/hurtEnemy";
import calcDamage from "../utils/calcDamage";
import { CURSE_CRIT } from "../constants";

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
    }
) {
    const { from, targetPos, critChance, critDamage, element, ownerId } = opts;

    const entity = k.add([
        k.sprite("poop"),
        k.anchor("center"),
        k.pos(from),
        {
            ownerId,
        },
        "pathEntity"
    ]);

    let pathEntity: GameObj | null = null;

    entity.onUpdate(() => {
        const direction = targetPos.sub(entity.pos).unit();
        entity.pos = entity.pos.add(direction.scale(200 * k.dt()));

        if (entity.pos.dist(targetPos) < 4) {
            pathEntity = k.add([
                k.sprite("poop"),
                k.pos(entity.pos),
                k.anchor("center"),
                {
                    ownerId,
                    update() {
                        const enemies = k.get("enemy") as EnemyGameObj[];

                        enemies.forEach(e => {
                            if (pathEntity?.pos.dist(e.pos) < 10) {
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

                                pathEntity && k.destroy(pathEntity);
                            }
                        });
                    }
                },
                "pathEntity"
            ]);

            k.destroy(entity);
        }
    });

}