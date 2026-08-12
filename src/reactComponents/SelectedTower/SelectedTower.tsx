import styles from "./SelectedTower.module.css";
import { useState, useEffect } from "react";
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import type { SelectedTowerUI, USlot } from '../../types';
import UpgradeSlot from "../UpgradeSlot/UpgradeSlot";
import { MAX_TOWER_UPGRADES, REDUCED_RANGE_TOWERS } from '../../constants';
import CostText from "../CostText/CostText";
import Popup from "../Popup/Popup";
import Button from "../Button/Button";
import PriorityButton from "../PriorityButton/PriorityButton";
import Stats from "../Stats/Stats";
import calcSellPrice from "../../utils/calcSellPrice";
import { playUISound } from "../../utils/soundHelpers";

export default function SelectedTower({ tower }: { tower: SelectedTowerUI }) {
    const {
        name,
        priority,
        stats,
        cost,
        pos,
        element,
        upgrades,
        unlockedUpgradeSlots,
        upgradeCost,
        addUpgradeSlot,
        setUpgrades,
        setPriority,
        sellTower
    } = tower;
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const iconScale = map.iconScale;
    const selectedUpgrade = gameState.selectedUpgrade;
    const onClick = addUpgradeSlot;
    const isUnlocked = (index: number) => index < unlockedUpgradeSlots;
    const isPurchasable = (index: number) => index === unlockedUpgradeSlots;
    const [upgradeSlots, setUpgradeSlots] = useState<USlot[]>(Array.from({ length: MAX_TOWER_UPGRADES }).map((_, index) => ({
        unlocked: isUnlocked(index),
        upgrade: upgrades[index] || null,
        highlighted: false,
        purchasable: isPurchasable(index)
    })));

    function highlightUpgradeSlots(slots: USlot[]): number[] {
        if (selectedUpgrade && !("type" in selectedUpgrade)) {
            const upgradeCost = selectedUpgrade.cost;
            const slotAvailable = (s: USlot) => s.unlocked && !s.upgrade;
            const availableSlots = slots.filter(slotAvailable).length;
            const result: number[] = [];

            if (availableSlots < upgradeCost) return [];

            let index = 0;
            let upgradeCount = 0;
            while (index < slots.length && upgradeCount < upgradeCost) {
                const slot = slots[index];
                if (slotAvailable(slot)) {
                    result.push(index);
                    upgradeCount++;
                }
                index++;
            }

            return result;

        }

        return [];
    }

    function addUpgrades() {
        if (!selectedUpgrade || "type" in selectedUpgrade) return;

        const highlightedIndexes = upgradeSlots
            .map((s, i) => (s.highlighted ? i : -1))
            .filter(i => i !== -1);

        if (highlightedIndexes.length === 0) return;

        const firstIndex = highlightedIndexes[0];

        let adjustedUpgrade = { ...selectedUpgrade };

        // halve range for aoe towers and lava tower
        if (
            adjustedUpgrade.stat === "range" &&
            REDUCED_RANGE_TOWERS.includes(name)
        ) {
            adjustedUpgrade.amount /= 2;
        }

        const newUpgrades = [
            ...upgrades,
            ...highlightedIndexes.map((index) => ({
                ...adjustedUpgrade,
                active: index === firstIndex,
            })),
        ];

        // setting upgrades for tower kaplay entity
        setUpgrades(newUpgrades);

        setGameState(prev => ({
            ...prev,
            upgrades: prev.upgrades.filter(upgrade => upgrade !== prev.selectedUpgrade),
            selectedUpgrade: null,
            selectedUI: {
                ...tower,
                upgrades: newUpgrades,
                ...(prev.selectedUI && "previewRange" in prev.selectedUI ? { previewRange:  prev.selectedUI?.previewRange ?? null }  : {})
            }
        }));

        playUISound(gameState.context, "equip");

    }

    useEffect(() => {
        setUpgradeSlots(prev => {
            const updated = prev.map((slot, index) => ({
                ...slot,
                upgrade: upgrades[index] || null,
                unlocked: isUnlocked(index),
                purchasable: isPurchasable(index),
            }));

            const hSlots = highlightUpgradeSlots(updated);

            return updated.map((slot, index) => ({
                ...slot,
                highlighted: hSlots.includes(index),
            }));
        });
    }, [selectedUpgrade, unlockedUpgradeSlots]);

    useEffect(() => {
        const highlightedCount = upgradeSlots.filter(s => s.highlighted).length;

        const shouldShowPreview =
            selectedUpgrade &&
            !("type" in selectedUpgrade) &&
            selectedUpgrade.stat === "range" &&
            highlightedCount > 0;

        const previewRange = shouldShowPreview
            ? stats.range +
            (REDUCED_RANGE_TOWERS.includes(name)
                ? selectedUpgrade.amount / 2
                : selectedUpgrade.amount)
            : null;

        setGameState(prev => {
            if (!prev.selectedUI) return prev;

            // avoid unnecessary updates
            if ("previewRange" in prev.selectedUI && prev.selectedUI.previewRange === previewRange) {
                return prev;
            }

            return {
                ...prev,
                selectedUI: {
                    ...prev.selectedUI,
                    previewRange
                }
            };
        });
    }, [selectedUpgrade, unlockedUpgradeSlots, stats.range, upgradeSlots, name]);

    return (
        <Popup mode="world" pos={pos}>
            <div className={styles.name}>{name}</div>
            <Stats stats={stats} element={element} scale={iconScale} />
            <div className={styles.upgrades}>
                {upgradeSlots.map((slot, index) => (
                    <UpgradeSlot
                        upgrade={slot.upgrade}
                        selectedUpgrade={selectedUpgrade && ("type" in selectedUpgrade) ? null : selectedUpgrade}
                        unlocked={slot.unlocked}
                        {...(slot.purchasable ? { onClick } : slot.highlighted ? { onClick: addUpgrades } : {})}
                        active={upgrades[index]?.active || false}
                        highlighted={slot.highlighted}
                        key={index}
                    >
                        {slot.purchasable && <CostText cost={upgradeCost} />}
                    </UpgradeSlot>
                ))}
            </div>

            {priority && <>
                <PriorityButton scale={iconScale} priority={priority} setPriority={setPriority} /><br />
            </>}

            <Button onClick={sellTower}>
                Sell <img style={{ width: `${8 * iconScale}px`, marginRight: '0.125em' }} src="sprites/coin.png" />{calcSellPrice(cost, unlockedUpgradeSlots)}
            </Button>
        </Popup>
    );
}