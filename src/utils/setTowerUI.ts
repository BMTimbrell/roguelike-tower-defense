import type { KAPLAYCtx } from "kaplay";
import { store, gameStateAtom } from "../store";
import { calcUpgradeCost } from "./calcUpgradeCost";
import type { SelectedFarmTowerUI, SelectedTowerUI, TargetPriority, TowerGameObj, Upgrade } from "../types";
import calcFireInterval from "./calcFireInterval";
import calcSellPrice from "./calcSellPrice";
import { SEEDS } from "../constants";
import { rebuildLava } from "./lavaHelpers";

export default function setTowerUI(k: KAPLAYCtx, type: "combat" | "farm", tower: TowerGameObj) {
    if (type === "combat") {
        store.set(gameStateAtom, prev => ({
            ...prev,
            selectedUI: {
                towerId: tower.instanceId,
                pos: tower.screenPos().scale(1 / k.getCamScale().x, 1 / k.getCamScale().y),
                priority: tower.priority,
                name: tower.name,
                stats: {
                    ...tower.stats,
                    ...(tower.timeData || tower.charge ? {
                        fireInterval: tower.stats.fireInterval *
                            (tower.timeData?.timeScaling.interval ? tower.timeData.timeMultiplier : 1) *
                            (1 - (tower.charge?.currentCharge ?? 0)),
                        damage: Math.round(
                            tower.stats.damage + (tower.timeData?.timeScaling.damage ? 
                                tower.timeData.timeMultiplier ** tower.timeData.timeScaling.damagePow - 1 : 0)
                        )
                    } : {})
                },
                cost: tower.cost,
                unlockedUpgradeSlots: tower.unlockedUpgradeSlots,
                upgrades: tower.upgrades,
                upgradeCost: tower.upgradeCost,
                element: tower.element,
                addUpgradeSlot: () => {
                    if (store.get(gameStateAtom).gold >= tower.upgradeCost) {
                        tower.unlockedUpgradeSlots++;

                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            gold: prev.gold - tower.upgradeCost
                        }));

                        tower.upgradeCost = calcUpgradeCost(tower.cost, tower.unlockedUpgradeSlots);
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            selectedUI: {
                                ...prev.selectedUI,
                                unlockedUpgradeSlots: tower.unlockedUpgradeSlots,
                                upgradeCost: tower.upgradeCost
                            } as SelectedTowerUI
                        }));
                    }
                },
                setUpgrades: (upgrades: Upgrade[]) => {
                    tower.upgrades = upgrades;
                    tower.upgrades.forEach(upgrade => {
                        if (upgrade.active && !upgrade.used) {
                            if (upgrade.stat === "fireInterval") {
                                const fireInterval = tower.stats.fireInterval;
                                const newInterval = calcFireInterval(fireInterval, upgrade.amount);
                                tower.stats.fireInterval = newInterval;
                            } else if (upgrade.stat === "critChance" || !upgrade.percentage) {
                                tower.stats[upgrade.stat] += upgrade.amount;
                            } else {
                                tower.stats[upgrade.stat] += Math.max(1, Math.round(tower.stats[upgrade.stat] * (upgrade.amount / 100)));
                            }
                            upgrade.used = true;
                        }
                    });

                    if (tower.lavaTiles) {
                        rebuildLava(k, tower);
                    }
                    return tower.stats;
                },
                setPriority: (priority: TargetPriority) => {
                    tower.priority = priority;
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        selectedUI: {
                            ...prev.selectedUI,
                            priority: tower.priority
                        } as SelectedTowerUI
                    }));
                },
                sellTower: () => {
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gold: prev.gold + calcSellPrice(tower.cost, tower.unlockedUpgradeSlots),
                        selectedUI: null
                    }));
                    k.destroy(tower);
                }
            } as SelectedTowerUI
        }));
    } else if (type === "farm") {
        const farmTowerUI = {
            towerId: tower.instanceId,
            pos: tower.screenPos().scale(1 / k.getCamScale().x, 1 / k.getCamScale().y),
            name: tower.name,
            cost: tower.cost,
            element: tower.element,
            sellTower: () => {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    gold: prev.gold + calcSellPrice(tower.cost, tower.unlockedUpgradeSlots),
                    selectedUI: null
                }));
                k.destroy(tower);
            },
            plantedSeed: tower.farmData?.plantedSeed ?? null,
            turnsRemaining: tower.farmData?.turnsRemaining ?? null,
            availableSeeds: ["nightshade", "chili", "starfruit"],
        } as SelectedFarmTowerUI;

        store.set(gameStateAtom, prev => ({
            ...prev,
            selectedUI: {
                ...farmTowerUI,
                plantSeed: (seedId) => {
                    tower.farmData = {
                        plantedSeed: seedId,
                        turnsRemaining: SEEDS[seedId].turnsToGrow
                    };

                    tower.gun.play("planted");

                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        selectedUI: {
                            ...farmTowerUI,
                            plantedSeed: tower?.farmData?.plantedSeed!!,
                            turnsRemaining: tower?.farmData?.turnsRemaining!!
                        }
                    }));
                }
            }
        }));

    }
}