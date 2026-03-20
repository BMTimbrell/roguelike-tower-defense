import type { ElementName, TowerStats } from "../../types";
import Popup from "../Popup/Popup";
import Stats from "../Stats/Stats";
import styles from './TowerPopup.module.css';

export default function TowerPopup({ 
    name, 
    stats, 
    cost, 
    description, 
    element, 
    scale, 
    pos, 
    ref 
}: { 
        name: string; 
        stats: TowerStats; 
        cost: number; 
        description: string; 
        element: ElementName; 
        scale: number; 
        pos: { 
            x: number; 
            y: number; 
        },
        ref: React.RefObject<HTMLDivElement | null>;
    }
) {
    return (
        <Popup mode="screen" pos={pos}>
            <div className={styles["popup-contents"]} ref={ref}>
                <div className={styles.name}>{name}</div>

                <div className={styles.description}>{description}</div>

                <Stats stats={stats} element={element} scale={scale} />

                {cost > 0 && <div className={styles.cost}>
                    Cost: <img style={{ width: `${8 * scale}px`, marginRight: "0.125em" }} src="sprites/coin.png" />{cost}
                </div>}
            </div>
        </Popup>
    );
}