import { startingOptionsAtom, mapAtom, gameStateAtom } from "../../store";
import { useAtom } from "jotai";
import styles from './StartingOptions.module.css';
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import TowerCard from "../TowerCard/TowerCard";
import { playUISound } from "../../utils/soundHelpers";

export default function StartingOptions() {
    const [startingOptions] = useAtom(startingOptionsAtom);
    const addLoadout = startingOptions.addLoadout;
    const [gameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;
    const options = startingOptions.options;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * fontScale}px` }}>
            <div className={styles.heading}>Pick a Loadout</div>

            <div className={styles.options}>
                {options.map((o, index) => (
                    <div
                        onClick={() => addLoadout(o.ids, o.upgrades)}
                        onMouseEnter={() => playUISound(gameState.context, "ui pop")}
                        className={styles.option}
                        key={index}
                    >
                        <div className={styles.towers}>
                            {o.ids.map((i, index) => (
                                <TowerCard key={index} id={i} scale={fontScale} />
                            ))}
                        </div>

                        <div className={styles.upgrades}>
                            {o.upgrades.map((u, index) => (
                                <UpgradeCard key={index} upgrade={u} scale={fontScale} showPopup={true} popupOffset={{ x: 0, y: 25 }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}