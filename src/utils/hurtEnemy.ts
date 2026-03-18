import type { KAPLAYCtx } from "kaplay";
import makeFloatingText from "../entities/FloatingText";
import { CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_SIZE, ELEMENTS, SMALL_DAMAGE_NUMBER_SIZE } from "../constants";
import type { ElementName, EnemyGameObj, TowerGameObj } from "../types";

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
}