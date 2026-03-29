import type { AttackContext, Song, TowerGameObj } from "../types";

export default function applySongBuff(tower: TowerGameObj, ctx: AttackContext, song: Song) {
    const k = ctx.context;
    const { duration, value, type } = song;

    tower.buffs ??= {};

    const now = k.time();

    const existing = tower.buffs[type];

    if (existing) {
        existing.expiresAt = now + duration;
        existing.value = value;
    } else {
        tower.buffs[type] = {
            value,
            expiresAt: now + duration
        };
    }
}