import { useAtom } from "jotai";
import { hoveredTotemAtom, mapAtom } from "../../store";
import styles from './TotemPopup.module.css';
import { TOTEMS } from "../../constants";

export default function TotemPopup() {
    const [totem] = useAtom(hoveredTotemAtom);
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;

    return (
        <div style={{ top: totem?.pos.y, left: totem?.pos.x, fontSize: `${12 * fontScale}px` }} className={styles.container}>
            <div className={styles.heading}>{totem?.id && TOTEMS[totem.id].name}</div>
            <div className={styles["description-container"]}>
                <div className={styles.description}>
                    <img style={{ marginRight: "4px" }} width={`${14 * map.iconScale}px`} src="sprites/enemy-totem-icon.png" />
                    <div>{totem?.id && TOTEMS[totem.id].enemyEffect.description}</div>
                </div>
                <div className={styles.description}>
                    <img width={`${14 * map.iconScale}px`} src="sprites/totem-tower-icon.png" />
                    <div>{totem?.id && TOTEMS[totem.id].playerBuff.description}</div>
                </div>
            </div>
        </div>
    );
}