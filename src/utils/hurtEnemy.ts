import type { KAPLAYCtx } from "kaplay";
import makeFloatingText from "../entities/FloatingText";
import { CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_SIZE, ELEMENTS, SMALL_DAMAGE_NUMBER_SIZE, TILE_SIZE, TOWER_RANGE_TOLERANCE } from "../constants";
import type { AttackContext, ElementName, EnemyGameObj, TowerGameObj } from "../types";
import spawnSummon from "../entities/Summon";

export default function hurtEnemy(k: KAPLAYCtx, opts: {
    target: EnemyGameObj;
    damage: number;
    element: ElementName;
    isCrit: boolean;
    ignoreArmour?: boolean;
    attacker?: TowerGameObj;
    statusDamage?: boolean;
}) {
    const { target, damage, element, isCrit, attacker, statusDamage, ignoreArmour } = opts;

    if (target.invincible) return;

    if (attacker?.killStacks !== undefined && target.hp() <= damage) {
        attacker.killStacks++;
        if (attacker.killStacks === 1) {
            k.add([
                k.pos(attacker.pos),
                k.text("" + attacker.killStacks, {
                    size: 12,
                    font: "free pixel"
                }),
                k.color(ELEMENTS[element].color),
                `killStackText${attacker.instanceId}`
            ]);
        } else {
            k.get(`killStackText${attacker.instanceId}`)[0].text = "" + attacker.killStacks;
        }
    }

    let remainingDamage = damage;
    let effectiveDamage = damage;

    if (target.armour && target.armour > 0 && !ignoreArmour) {
        // crits ignore reduced
        effectiveDamage = Math.round(damage * (isCrit ? 1 : 0.5));

        target.armour -= effectiveDamage;

        if (target.armour < 0) {
            remainingDamage = -target.armour;
            target.armour = 0;
        } else {
            remainingDamage = 0;
        }
    }

    target.hurt(remainingDamage);

    makeFloatingText(k, {
        pos: target.pos,
        text: '' + effectiveDamage,
        size: isCrit ? CRIT_DAMAGE_NUMBER_SIZE : statusDamage ? SMALL_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
        color: ELEMENTS[element].color
    });

    if (!statusDamage) ELEMENTS[element].applyEffect?.(k, { target, damage: effectiveDamage });

    if (attacker?.name === "Hammer Tower" && !target.isDying && Math.random() < effectiveDamage * 0.002) {
        console.log(effectiveDamage * 0.002)
        target.enterState("stunned");
    }

    // battery charge for battery tower
    const damageDealt = effectiveDamage;

    const batteries = k.get("tower").filter(t => t.battery);

    for (const b of batteries) {
        const dist = b.pos.dist(target.pos);

        if (dist <= b.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
            const stored = Math.max(1, damageDealt * b.battery.storePct);

            b.battery.charge = Math.min(
                b.battery.charge + stored,
                b.battery.maxCharge
            );
        }
    }

    // spawn ghost for necromancer
    const hero = k.get("hero")[0];
    if (
        hero?.placed &&
        hero.hasGhostSummon && target.hp() <= 0 &&
        hero.pos.add(TILE_SIZE / 2, TILE_SIZE / 2).dist(target.pos) <= hero.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE
    ) {
        const ghostCtx = {
            attacker: hero,
            damage: hero.stats.damage,
            element: hero.element,

            target: {
                type: "point",
                pos: target.pos,
                pathIndex: target.pathIndex + 1
            },

            context: k,
        } as AttackContext;

        const summon = spawnSummon(k, ghostCtx, "ghost", target.pos);
        summon.path = target.path;
    }
}