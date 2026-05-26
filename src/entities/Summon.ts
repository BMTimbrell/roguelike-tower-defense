import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { AttackContext, EnemyGameObj, TowerGameObj } from "../types";
import { CURSE_CRIT, SUMMONS, TILE_SIZE, type SummonId } from "../constants";
import { dirToRotation } from "./Enemy";
import hurtEnemy from "../utils/hurtEnemy";
import calcDamage from "../utils/calcDamage";
import getBuffValue from "../utils/getBuffValue";
import { gameStateAtom, store } from "../store";

export default function spawnSummon(k: KAPLAYCtx, ctx: AttackContext, id: SummonId, pos: Vec2) {
    const {
        name,
        damageMult,
        attackSpeedMult,
        speed,
        maxAttacks,
        sprite
    } = SUMMONS[id];

    const summon = k.add([
        k.sprite(sprite),
        k.pos(pos),
        k.rotate(0),
        k.anchor("center"),
        name,
        "summon",
        {
            damage: Math.round(ctx.damage * (
                damageMult + (name === "Zombie" && ctx.attacker.hasZombieBuff ? 2 : 0)
            )),
            fireInterval: ctx.attacker.stats.fireInterval / attackSpeedMult,
            attackTimer: 0,
            speed,
            maxAttacks: maxAttacks,
            attacks: 0,
            pathIndex: (ctx.target as { type: "point"; pos: Vec2; pathIndex?: number })?.pathIndex ?? 0,
            path: ctx.attacker.pathTiles.map(pt => k.vec2(pt.x * TILE_SIZE + TILE_SIZE / 2, pt.y * TILE_SIZE + TILE_SIZE / 2))
        },
        k.state("move", ["move", "attack", "die"])
    ]);

    summon.animSpeed = store.get(gameStateAtom).timeScale;

    summon.onStateEnter("move", () => {
        summon.play("move");
    });

    summon.onStateEnter("attack", ({ enemy }) => {
        summon.angle = dirToRotation(enemy.pos.sub(summon.pos));
        summon.play("attack");

        let bonusDamage = 0;

        // if (name === "Chomper") {
        //     const maxHp = enemy?.maxHP() ?? 1;
        //     const hp = enemy?.hp() ?? 0;
        //     const remainingHealthPercent = hp / maxHp;

        //     if (remainingHealthPercent >= 0.8) {
        //         bonusDamage = ctx.damage;
        //     }
        // }

        const { isCrit, damage } = calcDamage({
            bonusDamage,
            bonusCritChance: enemy.has("curse") ? CURSE_CRIT + (k.get("hero")[0]?.hasCurseBuff ? 10 : 0) : 0,
            critChance: ctx.attacker.stats.critChance + (getBuffValue(ctx.attacker as TowerGameObj, "critChance") * 100),
            critDamage: ctx.attacker.stats.critDamage * (1 + getBuffValue(ctx.attacker as TowerGameObj, "critDamage")),
            damage: summon.damage,
            damageMultiplier: 1 + getBuffValue(ctx.attacker as TowerGameObj, "damage")
        });

        hurtEnemy(k, {
            target: enemy,
            damage: damage,
            element: ctx.element,
            isCrit,
        });

        if (name === "Chomper" && enemy.hp() <= 0) {
            summon.attacks--;
        }

        summon.attacks++;

        if (
            name === "Zombie" && 
            ctx.attacker.hasZombieBuff && 
            Math.random() < 0.3 && !enemy.isDying &&
            !(enemy.shieldHp && k.get("shield").length)
        )
            enemy.enterState("stunned");
    });

    summon.onStateEnter("die", () => {
        summon.play("die");
    });

    summon.onAnimEnd(anim => {
        if (anim === "attack") {
            summon.enterState("move");
        } else if (anim === "die") {
            if (name === "Skeleton" && ctx.attacker.hasSkeletonBuff && summon.attacks >= summon.maxAttacks && Math.random() < 0.35) {
                ctx = {
                    ...ctx,
                    target: {
                        type: "point",
                        pos: summon.pos,
                        pathIndex: summon.pathIndex
                    }
                };
                spawnSummon(k, ctx, "skeleton", summon.pos);
            }
            k.destroy(summon);
        }
    });

    summon.onStateUpdate("move", () => {
        const timeScale = store.get(gameStateAtom).timeScale;
        if (summon.attacks >= summon.maxAttacks) {
            // 75% chance to persist with ghost buff
            if (name === "Ghost" && ctx.attacker.hasGhostBuff && Math.random() < 0.75) {
                summon.attacks = summon.maxAttacks - 1;
            } else {
                summon.enterState("die");
            }
        }

        if (summon.attackTimer > 0) {
            summon.attackTimer -= k.dt() * timeScale;
        }

        const next = summon.path[summon.pathIndex - 1];
        if (!next) return;

        const dir = next.sub(summon.pos).unit();
        summon.pos = summon.pos.add(dir.scale(summon.speed * k.dt() * timeScale));

        summon.angle = dirToRotation(dir);

        if (summon.attackTimer <= 0) {
            const enemy = (k.get("enemy") as EnemyGameObj[]).find(e => e.pos.dist(summon.pos) <= TILE_SIZE && !e.invincible);
            if (enemy) {
                summon.attackTimer += summon.fireInterval;
                summon.enterState("attack", { enemy });
            }
        }

        if (summon.pos.dist(next) <= 1) {
            summon.pathIndex--;

            if (summon.pathIndex <= 0) {
                summon.enterState("die");
            }
        }
    });

    return summon;
}