export default function calcDamage(opts: {
    damage: number;
    bonusDamage: number;
    bonusCritChance: number;
    critChance: number;
    critDamage: number;
    damageMultiplier?: number;
}) {
    const { damage, bonusDamage, bonusCritChance, critChance, critDamage, damageMultiplier } = opts;
    const roll = Math.random();

    const isCrit = roll < (critChance + bonusCritChance) / 100;

    const baseDamage = (damage + bonusDamage) * (damageMultiplier ?? 1);
    const critDamageMod = isCrit ? critDamage / 100 : 1;
    const finalDamage = Math.round(baseDamage * critDamageMod);

    return {
        isCrit,
        damage: finalDamage
    };
}