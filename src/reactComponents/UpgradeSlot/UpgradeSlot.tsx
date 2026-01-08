import type { Upgrade } from "../../types";
import styles from "./UpgradeSlot.module.css";

type UpgradeSlotProps = {
    upgrade: Upgrade | null;
    unlocked: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    highlighted: boolean;
    active: boolean;
};

export default function UpgradeSlot({ upgrade, unlocked, onClick, children, highlighted, active }: UpgradeSlotProps) {
    return (
        <div onClick={onClick} className={`${styles.slot} ${!unlocked ? styles.locked : ''} ${highlighted ? styles.highlighted : ''}`}>
            <div className={styles.cost}>
                {children}
            </div>
            {upgrade && (
                <div className={`${styles.upgrade} ${active && upgrade.cost > 1 ? styles[`multi-slot${upgrade.cost}`] : ''}`}>
                    <div className={styles.name}>{upgrade.stat}</div>
                </div>
            )}
        </div>
    );
}