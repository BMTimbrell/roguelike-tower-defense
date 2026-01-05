export function calcUpgradeCost(baseCost: number, upgradeCount: number): number {
    return Math.round(baseCost * upgradeCount * 0.75);
}