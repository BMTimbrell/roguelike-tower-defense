import { useAtom } from "jotai";
import { hoveredHellMapEntityAtom, mapAtom } from "../../store";
import styles from './TotemPopup.module.css';
import { OBELISKS, TOTEMS } from "../../constants";

export default function TotemPopup() {
    const [mapEntity] = useAtom(hoveredHellMapEntityAtom);
    const isTotem = mapEntity?.type === "totem";
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;

    return (
        <div style={{ top: mapEntity?.pos.y, left: mapEntity?.pos.x, fontSize: `${12 * fontScale}px` }} className={styles.container}>
            <div className={styles.heading}>{mapEntity?.id && (isTotem ? TOTEMS[mapEntity.id] : OBELISKS[mapEntity.id]).name}</div>
            <div className={styles["description-container"]}>
                {isTotem && <div className={styles.description}>
                    <img style={{ marginRight: "4px" }} width={`${14 * map.iconScale}px`} src="sprites/enemy-totem-icon.png" />
                    <div>{mapEntity?.id && TOTEMS[mapEntity.id].enemyEffect.description}</div>
                </div>}
                <div className={styles.description}>
                    <img width={`${14 * map.iconScale}px`} src="sprites/totem-tower-icon.png" />
                    <div>{mapEntity?.id && (isTotem ? TOTEMS[mapEntity.id].playerBuff : OBELISKS[mapEntity.id]).description}</div>
                </div>
            </div>
        </div>
    );
}