export default function calcCrit(critChance: number, critDamage: number): { willCrit: boolean; critDamage: number; } {
    const roll = Math.random();
    const willCrit = roll < critChance / 100;

    return {
        willCrit,
        critDamage: 1 + (willCrit ? critDamage / 100 : 0)
    };
} 