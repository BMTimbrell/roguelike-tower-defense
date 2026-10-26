import type { KAPLAYCtx } from "kaplay";
import type { EnemyGameObj } from "../types";
import { ELEMENTS } from "../constants";

export default function applyToxicAuraEffect(k: KAPLAYCtx, target: EnemyGameObj) {
    // Only affect enemies that are already poisoned.
    if (!target.has("poison") || target.statusImmunity) return;

    const effects = [
        ELEMENTS.Ice,
        ELEMENTS.Dark,
        ELEMENTS.Light
    ];

    const effect = effects[k.randi(effects.length)];

    effect.applyEffect?.(k, { damage: 0, target });
}