export default function calcDamage(opts: {
    damage: number;
    bonusDamage: number;
    bonusCritChance: number;
    critChance: number;
    critDamage: number;

}): { isCrit: boolean; damage: number; } {
    const { damage, bonusDamage, bonusCritChance, critChance, critDamage } = opts;
    const roll = Math.random();
    const isCrit = roll < (critChance + bonusCritChance) / 100;

    const critDamageMod = 1 + (isCrit ? critDamage / 100 : 0);
    const finalDamage = Math.round((damage + bonusDamage) * critDamageMod);

    return {
        isCrit,
        damage: finalDamage
    };
} 