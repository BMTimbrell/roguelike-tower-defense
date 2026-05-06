import type { Song, TowerGameObj } from "../types";

export default function applySongBuff(tower: TowerGameObj, song: Song) {
    const { duration, value, type } = song;

    tower.buffs ??= {};

    const existing = tower.buffs[type];

    if (existing) {
        existing.timeLeft = duration;
        existing.value = value;
    } else {
        tower.buffs[type] = {
            value,
            timeLeft: duration
        };
    }
}