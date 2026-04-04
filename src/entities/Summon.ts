import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { AttackContext, EnemyGameObj, TowerGameObj } from "../types";
import { CURSE_CRIT, SUMMONS, TILE_SIZE, type SummonId } from "../constants";
import { dirToRotation } from "./Enemy";
import hurtEnemy from "../utils/hurtEnemy";
import calcDamage from "../utils/calcDamage";
import getBuffValue from "../utils/getBuffValue";

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
            damage: ctx.damage * damageMult,
            fireInterval: ctx.attacker.stats.fireInterval / attackSpeedMult,
            attackTimer: 0,
            speed,
            maxAttacks,
            attacks: 0,
            pathIndex: (ctx.target as { type: "point"; pos: Vec2; pathIndex?: number })?.pathIndex ?? 0,
            path: ctx.attacker.pathTiles.map(pt => k.vec2(pt.x * TILE_SIZE + TILE_SIZE / 2, pt.y * TILE_SIZE + TILE_SIZE / 2))
        },
        k.state("move", ["move", "attack", "die"])
    ]);

    summon.onStateEnter("move", () => {
        summon.play("move");
    });

    summon.onStateEnter("attack", ({ enemy }) => {
        summon.play("attack");

        const { isCrit, damage } = calcDamage({
            bonusDamage: 0,
            bonusCritChance: enemy.has("curse") ? CURSE_CRIT : 0,
            critChance: ctx.attacker.stats.critChance + (getBuffValue(k, ctx.attacker as TowerGameObj, "critChance") * 100),
            critDamage: ctx.attacker.stats.critDamage * (1 + getBuffValue(k, ctx.attacker as TowerGameObj, "critDamage")),
            damage: summon.damage,
            damageMultiplier: damageMult
        });

        hurtEnemy(k, {
            target: enemy,
            damage: damage,
            element: ctx.element,
            isCrit,
        });
    });

    summon.onStateEnter("die", () => {
        summon.play("die");
    });

    summon.onAnimEnd(anim => {
        if (anim === "attack") {
            summon.enterState("move");
        } else if (anim === "die") {
            k.destroy(summon);
        }
    });

    summon.onStateUpdate("move", () => {
        if (summon.attackTimer > 0) {
            summon.attackTimer -= k.dt();
        }

        const next = summon.path[summon.pathIndex - 1];
        if (!next) return;

        const dir = next.sub(summon.pos).unit();
        summon.move(dir.scale(summon.speed));

        summon.angle = dirToRotation(dir);

        if (summon.attackTimer <= 0) {
            const enemy = (k.get("enemy") as EnemyGameObj[]).find(e => e.pos.dist(summon.pos) <= TILE_SIZE);
            if (enemy) {
                summon.attackTimer += summon.fireInterval;
                summon.attacks++;
                summon.enterState("attack", { enemy });
            }
        }

        if (summon.pos.dist(next) <= 2) {
            summon.pathIndex--;

            if (summon.pathIndex <= 1 || summon.attacks >= summon.maxAttacks) {
                summon.enterState("die");
            }
        }
    });

}