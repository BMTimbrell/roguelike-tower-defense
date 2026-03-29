import type { KAPLAYCtx } from "kaplay";
import type { BuffType, TowerGameObj } from "../types";

export default function getBuffValue(
    k: KAPLAYCtx,
    unit: TowerGameObj,
    type: BuffType
) {
    if (!unit.buffs) return 0;

    const now = k.time();
    const buff = unit.buffs[type];

    if (!buff) return 0;

    if (buff.expiresAt <= now) {
        delete unit.buffs[type];
        return 0;
    }

    return buff.value;
}