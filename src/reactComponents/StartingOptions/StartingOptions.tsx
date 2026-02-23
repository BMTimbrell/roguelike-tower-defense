import { startingOptionsAtom, mapAtom } from "../../store";
import { useAtom } from "jotai";
import styles from './StartingOptions.module.css';
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import TowerCard from "../TowerCard/TowerCard";

export default function StartingOptions() {
    const [startingOptions] = useAtom(startingOptionsAtom);
    const addLoadout = startingOptions.addLoadout;
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const options = startingOptions.options;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.heading}>Pick a Loadout</div>

            <div className={styles.options}>
                {options.map((o, index) => (
                    <div onClick={() => addLoadout(o.ids, o.upgrades)} className={styles.option} key={index}>
                        <div className={styles.towers}>
                            {o.ids.map((i, index) => (
                                <TowerCard key={index} id={i} scale={scale} />
                            ))}
                        </div>

                        <div className={styles.upgrades}>
                            {o.upgrades.map((u, index) => (
                                <UpgradeCard key={index} upgrade={u} scale={scale} showPopup={true} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}