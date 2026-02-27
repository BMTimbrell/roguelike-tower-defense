import type { KAPLAYCtx } from "kaplay";
import makeFloatingText from "../entities/FloatingText";
import { CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_SIZE, ELEMENTS } from "../constants";
import type { ElementName, EnemyGameObj } from "../types";

export default function hurtEnemy(k: KAPLAYCtx, opts: { target: EnemyGameObj; damage: number; element: ElementName; isCrit: boolean; }) {
    const { target, damage, element, isCrit } = opts;

    target.hurt(damage);
    makeFloatingText(k, {
        pos: target.pos,
        text: '' + damage,
        size: isCrit ? CRIT_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
        color: ELEMENTS[element].color
    });

    ELEMENTS[element].applyEffect?.(k, { target, damage });
}