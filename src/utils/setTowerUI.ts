import type { KAPLAYCtx } from "kaplay";
import { store, gameStateAtom } from "../store";
import { calcUpgradeCost } from "./calcUpgradeCost";
import type { SelectedFarmTowerUI, SelectedTowerUI, TargetPriority, TowerGameObj, Upgrade } from "../types";
import calcFireInterval from "./calcFireInterval";
import calcSellPrice from "./calcSellPrice";
import { SCYTHE_MAX_KILL_STACKS, SEEDS } from "../constants";
import { rebuildLava } from "./lavaHelpers";
import { playSfx, playUISound } from "./soundHelpers";

export default function setTowerUI(k: KAPLAYCtx, type: "combat" | "farm", tower: TowerGameObj) {
    if (type === "combat") {
        const baseDamage = tower.stats.damage;

        let bonusDamage = 0;

        // each modifier becomes a named source
        const sources: { name: string; value: number }[] = [];

        // ----------------------
        // Time scaling
        // ----------------------
        if (tower.timeData?.timeScaling.damage) {
            const value =
                Math.pow(
                    tower.timeData.timeMultiplier,
                    tower.timeData.timeScaling.damagePow
                ) - 1;

            bonusDamage += value;

            sources.push({
                name: "time scaling",
                value
            });
        }

        // ----------------------
        // Overheat
        // ----------------------
        if (tower.overheat?.current) {
            const value = tower.overheat.current * 0.3;

            bonusDamage += value;

            sources.push({
                name: "overheat",
                value
            });
        }

        // ----------------------
        // Battery (if exists)
        // ----------------------
        if (tower.battery) {
            const value = tower.battery.charge * 0.42;

            bonusDamage += value;

            sources.push({
                name: "battery",
                value
            });
        }

        // ----------------------
        // Kill stacks (scythe)
        // ----------------------
        if (tower.killStacks) {
            const value = Math.min(tower.killStacks, SCYTHE_MAX_KILL_STACKS);

            bonusDamage += value;

            sources.push({
                name: "stacks",
                value
            });
        }

        // ----------------------
        // FINAL DAMAGE (what enemies actually receive)
        // ----------------------
        const damageValue = Math.round(baseDamage + bonusDamage);

        // ----------------------
        // UI LABEL
        // ----------------------
        const damageLabel =
            sources.length > 0 && damageValue > baseDamage
                ? `${damageValue} (${baseDamage} base + ${sources
                    .map(s => s.name)
                    .join(" + ")})`
                : `${damageValue}`;


        store.set(gameStateAtom, prev => ({
            ...prev,
            selectedUI: {
                ...(prev.selectedUI && "previewRange" in prev.selectedUI ? { previewRange: prev.selectedUI?.previewRange ?? null } : {}),
                towerId: tower.instanceId,
                pos: tower.screenPos(),
                priority: tower.priority,
                name: tower.name,
                stats: {
                    ...tower.stats,
                    ...(tower.timeData || tower.charge || tower.overheat?.current || tower.killStacks || tower.battery || tower.hasThirst ? {
                        fireInterval: tower.stats.fireInterval *
                            (tower.timeData?.timeScaling.interval ? tower.timeData.timeMultiplier : 1) *
                            (1 - (tower.charge?.currentCharge ?? 0)) *
                            (tower.isThirsty ? 2 : 1),
                        damage: damageLabel
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

                        playUISound(k, "ui buy");

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
                            if (upgrade.stat === "thirst") {
                                tower.thirstImmune = true;
                                tower.isThirsty = false;
                                playSfx(k, "drinking", 5, tower.pos);
                                tower.isDrinking = true;
                            } else if (upgrade.stat === "fireInterval") {
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
                    playUISound(k, "ui buy");
                    k.destroy(tower);
                }
            } as SelectedTowerUI
        }));
    } else if (type === "farm") {
        const farmTowerUI = {
            towerId: tower.instanceId,
            pos: tower.screenPos(),
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