import type { Upgrade } from "../../types";
import styles from './UpgradePopup.module.css';
import Popup from "../Popup/Popup";

export default function UpgradePopup({ upgrade, pos, fontSize }: { upgrade: Upgrade; pos: { x: number; y: number; } | null; fontSize?: string }) {
    return (
        <Popup mode="screen" pos={{ x: pos?.x || 0, y: pos?.y || 0 }}>
            <div style={{ fontSize }} className={styles["upgrade-info"]}>
                {upgrade.name + (upgrade.stat !== "thirst" ? ` +${upgrade.amount}${upgrade.percentage ? '%' : ''}` : '')}
            </div>
        </Popup>
    );
}