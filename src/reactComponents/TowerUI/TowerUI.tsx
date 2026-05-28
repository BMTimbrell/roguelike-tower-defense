import { useAtom } from "jotai";
import { gameStateAtom, mapAtom } from "../../store";
import TowerCard from "../TowerCard/TowerCard";
import styles from './TowerUI.module.css';

export default function TowerUI() {
    const [gameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);

    return (
        <div className={styles.container}>
            {gameState.towerButtons.map((tower, index) => (
                <TowerCard key={index} id={tower.id} scale={map.fontScale} />
            ))}
        </div>
    );
}