import Popup from "../Popup/Popup";
import styles from './DescriptionPopup.module.css';

export default function DescriptionPopup({ pos, children }: { pos: { x: number; y: number; }; children: React.ReactNode; }) {
    return (
        <Popup mode="screen" pos={{ x: pos.x, y: pos.y }} pStyle={{ pointerEvents: "none" }}>
            <div className={styles["description"]}>
                {children}
            </div>
        </Popup>
    );
}