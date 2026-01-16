import type { Upgrade } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';

export default function Upgrades({ upgrades }: { upgrades: Upgrade[] }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;

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
                    onClick={() => handleClick(upgrade)}
                    className={`${styles.upgrade} ${gameState.selectedUpgrade === upgrade ? styles.selected : ''}`}
                    key={index}
                >
                    <div className={styles.icon}>
                        <img width={`${32 * scale}px`} src={upgrade.icon} /> 
                        <div>+{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
                    </div>
                    <div>Cost: {upgrade.cost}</div>
                </div>
            ))}
        </div>
    );
}