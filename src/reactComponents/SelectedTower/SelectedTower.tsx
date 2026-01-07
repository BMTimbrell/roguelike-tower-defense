import styles from "./SelectedTower.module.css";
import { useState, useEffect } from "react";
import { mapAtom, gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import type { SelectedTower, USlot } from '../../types';
import UpgradeSlot from "../UpgradeSlot/UpgradeSlot";
import { MAX_TOWER_UPGRADES } from '../../constants';
import CostText from "../CostText/CostText";

export default function SelectedTower({ tower }: { tower: SelectedTower }) {
    const {
        name, 
        range, 
        fireInterval, 
        cost, 
        pos, 
        upgrades, 
        unlockedUpgradeSlots,
        upgradeCost,
        addUpgradeSlot
    } = tower;
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const selectedUpgrade = gameState.selectedUpgrade;
    const scale = map.scale;
    const onClick = addUpgradeSlot;
    const isUnlocked = (index: number) => index < unlockedUpgradeSlots;
    const isPurchasable = (index: number) => index === unlockedUpgradeSlots;

    const [upgradeSlots, setUpgradeSlots] = useState<USlot[]>(Array.from({ length: MAX_TOWER_UPGRADES }).map((_, index) => ({
        unlocked: isUnlocked(index),
        upgrade: upgrades[index] || null,
        highlighted: false,
        purchasable: isPurchasable(index)
    })));

    function highlightUpgradeSlots(): number[] {
        if (selectedUpgrade) {
            const upgradeCost = selectedUpgrade.cost;
            const slotAvailable = (s: USlot) => s.unlocked && !s.upgrade;
            const availableSlots = upgradeSlots.filter(slotAvailable).length;
            const result: number[] = [];

            if (availableSlots < upgradeCost) return [];

            let index = 0;
            let upgradeCount = 0;
            while (index < upgradeSlots.length && upgradeCount < upgradeCost) {
                const slot = upgradeSlots[index];
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

    useEffect(() => {
        setUpgradeSlots(prev => prev.map((slot, index) => ({
            ...slot,
            unlocked: isUnlocked(index),
            purchasable: isPurchasable(index)
        })));

        const hSlots = highlightUpgradeSlots();
        if (hSlots) {
            setUpgradeSlots(prev => prev.map((slot, index) => ({
                ...slot,
                highlighted: hSlots.includes(index)
            })));
        }

    }, [unlockedUpgradeSlots, selectedUpgrade, upgradeSlots]);

    return (
        <div 
            className={styles.container}
            style={{
                '--x': `calc(${map.x}px + ${pos.x} * ${scale}px)`,
                '--y': `calc(${map.y}px + ${pos.y} * ${scale}px)`,
                fontSize: `calc(16px * ${scale})`
            } as React.CSSProperties}
        >
            <div className={styles.name}>{name}</div>
            <div className={styles.stats}>
                <div>Fire rate: {fireInterval}</div>
                <div>Range: {range}</div>
            </div>
            <div className={styles.upgrades}>
                {upgradeSlots.map((slot, index) => (
                    <UpgradeSlot 
                        upgrade={slot.upgrade} 
                        unlocked={slot.unlocked}
                        {...(slot.purchasable ? { onClick } : {})}
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