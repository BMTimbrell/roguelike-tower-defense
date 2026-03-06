import type { KAPLAYCtx } from "kaplay";
import makeFloatingText from "../entities/FloatingText";
import { CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_SIZE, ELEMENTS } from "../constants";
import type { ElementName, EnemyGameObj, TowerGameObj } from "../types";

export default function hurtEnemy(k: KAPLAYCtx, opts: {
    target: EnemyGameObj;
    damage: number;
    element: ElementName;
    isCrit: boolean;
    attacker?: TowerGameObj
}) {
    const { target, damage, element, isCrit, attacker } = opts;

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

    target.hurt(damage);
    makeFloatingText(k, {
        pos: target.pos,
        text: '' + damage,
        size: isCrit ? CRIT_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
        color: ELEMENTS[element].color
    });

    ELEMENTS[element].applyEffect?.(k, { target, damage });
}