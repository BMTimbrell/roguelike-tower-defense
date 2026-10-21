import type { Song, TowerGameObj } from "../types";

export default function applySongBuff(tower: TowerGameObj, song: Song) {
    const { duration, value, type, extendSongs = 0 } = song;

    tower.buffs ??= {};

     // Extend all existing song buffs
    if (extendSongs > 0) {
        Object.values(tower.buffs).forEach(buff => {
            if (buff && buff.timeLeft > 0) {
                buff.timeLeft += extendSongs;
            }
        });
    }

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