export function calcUpgradeCost(baseCost: number, upgradeCount: number): number {
    return Math.round(baseCost * (upgradeCount + 1) * 0.1);
}