import type { BuffType, TowerGameObj } from "../types";

export default function getBuffValue(
    unit: TowerGameObj,
    type: BuffType
) {
    if (!unit.buffs) return 0;

    const buff = unit.buffs[type];

    if (!buff) return 0;

    if (buff.timeLeft <= 0) {
        delete unit.buffs[type];
        return 0;
    }

    return buff.value;
}