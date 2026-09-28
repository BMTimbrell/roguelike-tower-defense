const UPGRADE_COST_MULT = 0.067;

export function calcUpgradeCost(
    baseCost: number,
    upgradeCount: number
): number {
    return Math.round(
        baseCost *
        (upgradeCount + 1) *
        UPGRADE_COST_MULT
    );
}