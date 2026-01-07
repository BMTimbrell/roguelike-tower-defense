import type { Upgrade } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';

export default function Upgrades({ upgrades } : { upgrades: Upgrade[] }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);

    const handleClick = (upgrade: Upgrade) => {
        if (gameState.gold >= upgrade.cost) {
            setGameState(prev => ({
                ...prev,
                selectedUpgrade: upgrade
            }));
        }
    };

    return (
        <div className={styles.container}>
            {upgrades.map((upgrade, index) => (
                <div
                    onClick={() => handleClick(upgrade)} 
                    className={`${styles.upgrade} ${gameState.selectedUpgrade === upgrade ? styles.selected : ''}`}
                    key={index}
                >
                    <div>{upgrade.stat.charAt(0).toUpperCase() + upgrade.stat.slice(1)}: +{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
                    <div>Cost: {upgrade.cost}</div>
                </div>
            ))}
        </div>
    );
}