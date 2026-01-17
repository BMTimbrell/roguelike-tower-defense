import type { Upgrade } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import React, { useState, useRef } from 'react';
import UpgradePopup from "../UpgradePopup/UpgradePopup";

export default function Upgrades({ upgrades }: { upgrades: Upgrade[] }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [hoveredUpgrade, setHoveredUpgrade] = useState<Upgrade | null>(null);
    const [pos, setPos] = useState<{ x: number; y: number; } | null>(null);

    const handleClick = (upgrade: Upgrade) => {
        setGameState(prev => ({
            ...prev,
            selectedUpgrade: upgrade
        }));
    };

    return (
        <div className={styles.container}>
            {upgrades.map((upgrade, index) => (
                    <div
                        key={index}
                        onClick={() => handleClick(upgrade)}
                        onMouseEnter={e => {
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            setPos({
                                x: rect.x,
                                y: rect.y - 35 * scale
                            });
                            setHoveredUpgrade(upgrade);
                        }}
                        onMouseLeave={() => setHoveredUpgrade(null)}
                        className={`${styles.upgrade} ${gameState.selectedUpgrade === upgrade ? styles.selected : ''}`}
                    >
                        <div className={styles.icon}>
                            <img width={`${32 * scale}px`} src={upgrade.icon} />
                            <div>+{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
                        </div>
                        <div>Cost: {upgrade.cost}</div>
                    </div>
            ))}

            {hoveredUpgrade && <UpgradePopup upgrade={hoveredUpgrade} pos={pos} />}
        </div>
    );
}