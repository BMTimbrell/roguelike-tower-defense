import styles from "./SelectedTower.module.css";
import { useState, useEffect } from "react";
import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import type { SelectedTower, USlot } from '../../types';
import UpgradeSlot from "../UpgradeSlot/UpgradeSlot";
import { MAX_TOWER_UPGRADES } from '../../constants';
import CostText from "../CostText/CostText";
import Popup from "../Popup/Popup";

export default function SelectedTower({ tower }: { tower: SelectedTower }) {
    const {
        name,
        stats,
        cost,
        pos,
        upgrades,
        unlockedUpgradeSlots,
        upgradeCost,
        addUpgradeSlot,
        setUpgrades
    } = tower;
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const selectedUpgrade = gameState.selectedUpgrade;
    const onClick = addUpgradeSlot;
    const isUnlocked = (index: number) => index < unlockedUpgradeSlots;
    const isPurchasable = (index: number) => index === unlockedUpgradeSlots;
    const { damage, range, fireInterval, critChance, critDamage } = stats;
    const [upgradeSlots, setUpgradeSlots] = useState<USlot[]>(Array.from({ length: MAX_TOWER_UPGRADES }).map((_, index) => ({
        unlocked: isUnlocked(index),
        upgrade: upgrades[index] || null,
        highlighted: false,
        purchasable: isPurchasable(index)
    })));

    function highlightUpgradeSlots(slots: USlot[]): number[] {
        if (selectedUpgrade) {
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
        if (!selectedUpgrade) return;

        const highlightedIndexes = upgradeSlots
            .map((s, i) => (s.highlighted ? i : -1))
            .filter(i => i !== -1);

        if (highlightedIndexes.length === 0) return;

        const firstIndex = highlightedIndexes[0];

        const newUpgrades = [
            ...upgrades,
            ...highlightedIndexes.map((index) => ({
                ...selectedUpgrade,
                active: index === firstIndex,
            })),
        ];

        // setting upgrades for tower kaplay entity
        setUpgrades(newUpgrades);

        setGameState(prev => ({
            ...prev,
            upgrades: prev.upgrades.filter(upgrade => upgrade !== prev.selectedUpgrade),
            selectedUpgrade: null,
            selectedTower: {
                ...tower,
                upgrades: newUpgrades
            }
        }));

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


    return (
        <Popup mode="world" pos={pos}>
            <div className={styles.name}>{name}</div>
            <div className={styles.stats}>
                <div>Damage: {damage}</div>
                <div>Fire Rate: {(1 / fireInterval).toFixed(1)}/sec</div>
                <div>Range: {range}</div>
                <div>Crit Chance: {critChance}%</div>
                <div>Crit Damage: {critDamage}%</div>
            </div>
            <div className={styles.upgrades}>
                {upgradeSlots.map((slot, index) => (
                    <UpgradeSlot
                        upgrade={slot.upgrade}
                        selectedUpgrade={selectedUpgrade}
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
        </Popup>
    );
}