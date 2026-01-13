import styles from "./SelectedTower.module.css";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { mapAtom, gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import type { SelectedTower, USlot } from '../../types';
import UpgradeSlot from "../UpgradeSlot/UpgradeSlot";
import { MAX_TOWER_UPGRADES } from '../../constants';
import CostText from "../CostText/CostText";

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
    const [map] = useAtom(mapAtom);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const selectedUpgrade = gameState.selectedUpgrade;
    const scale = map.scale;
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
    const popupRef = useRef<HTMLDivElement | null>(null);
    const [yOffset, setYOffset] = useState(0);

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

    useLayoutEffect(() => {
        const el = popupRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const padding = 8;

        const overflowBottom = rect.bottom - window.innerHeight + padding;

        if (overflowBottom > 0) {
            setYOffset(-overflowBottom);
        } else {
            setYOffset(0);
        }

    }, [pos.x, pos.y, scale]);

    return (
        <div
            ref={popupRef}
            className={styles.container}
            style={{
                '--x': `calc(${map.x}px + ${pos.x} * ${scale}px)`,
                '--y': `calc(${map.y}px + ${pos.y} * ${scale}px + ${yOffset}px)`,
                fontSize: `calc(16px * ${scale})`
            } as React.CSSProperties}
        >
            <div className={styles.name}>{name}</div>
            <div className={styles.stats}>
                <div>Damage: {damage}</div>
                <div>Fire rate: {(1 / fireInterval).toFixed(1)}/sec</div>
                <div>Range: {range}</div>
                <div>Crit chance: {critChance}%</div>
                <div>Crit damage: {critDamage}%</div>
            </div>
            <div className={styles.upgrades}>
                {upgradeSlots.map((slot, index) => (
                    <UpgradeSlot
                        upgrade={slot.upgrade}
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
        </div>
    );
}