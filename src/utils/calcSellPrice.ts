import { calcUpgradeCost } from "./calcUpgradeCost";

export default function(cost: number, upgradeCount: number): number {
    let result = cost / 2;
    const upgradeCost = calcUpgradeCost(cost, upgradeCount);
    result += upgradeCost / 2;
    return Math.round(result);
}