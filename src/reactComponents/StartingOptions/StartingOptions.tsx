import { startingOptionsAtom, mapAtom } from "../../store";
import { useAtom } from "jotai";
import styles from './StartingOptions.module.css';
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import TowerCard from "../TowerCard/TowerCard";

export default function StartingOptions() {
    const [startingOptions] = useAtom(startingOptionsAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const options = startingOptions.options;

    return (
        <>
            <div style={{ fontSize: `${16 * scale}px` }} className={styles.options}>
                {options.map((o, index) => (
                    <div className={styles.option} key={index}>
                        <div className={styles.towers}>
                            {o.ids.map((i, index) => (
                                <TowerCard key={index} id={i} scale={scale} />
                            ))}
                        </div>

                        <div className={styles.upgrades}>
                            {o.upgrades.map((u, index) => (
                                <UpgradeCard key={index} upgrade={u} scale={2} showPopup={true} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}