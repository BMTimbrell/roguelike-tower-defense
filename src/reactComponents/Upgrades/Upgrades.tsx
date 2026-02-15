import type { Upgrade } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { useState } from 'react';
import UpgradePopup from "../UpgradePopup/UpgradePopup";
import Card from "../Card/Card";

export default function Upgrades({ upgrades }: { upgrades: Upgrade[] }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);

    const handleClick = (upgrade: Upgrade) => {
        setGameState(prev => ({
            ...prev,
            selectedUpgrade: upgrade
        }));
    };

    return (
        <div className={styles.container}>
            {upgrades.map((upgrade, index) => (
                <Card 
                    key={`${index}${gameState.reroll.rerollCount}`}
                    popup={<UpgradePopup upgrade={upgrade} pos={popupPos} />} 
                    setPopupPos={setPopupPos} 
                    scale={scale} 
                    {... (upgrade?.animationDelay ? { animationDelay: upgrade.animationDelay } : {})}
                    classNames={[gameState.selectedUpgrade === upgrade ? styles.selected : '']}
                    handleClick={() => handleClick(upgrade)}
                >
                    <div className={styles.icon}>
                        <img width={`${32 * scale}px`} src={upgrade.icon} />
                        <div>+{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
                    </div>
                    <div>Cost: {upgrade.cost}</div>
                </Card>

            ))}
        </div>
    );
}