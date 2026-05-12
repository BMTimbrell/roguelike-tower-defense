import { calcUpgradeCost } from "./calcUpgradeCost";

export default function(cost: number, upgradeCount: number): number {
    let result = cost * 0.75;
    let upgradeCost = 0;

    for (let i = 0; i < upgradeCount + 1; i++) {
        if (i < 1) continue;

        upgradeCost += calcUpgradeCost(cost, i - 1);
    }

    result += upgradeCost * 0.75;
    return Math.round(result);
}