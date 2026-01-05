import type { Upgrade } from "../../types";
import styles from "./UpgradeSlot.module.css";

type UpgradeSlotProps = {
    upgrade: Upgrade | null;
    unlocked: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
};

export default function UpgradeSlot({ upgrade, unlocked, onClick, children }: UpgradeSlotProps) {
    return (
        <div onClick={onClick} className={`${styles.slot} ${!unlocked && styles.locked}`}>
            <div className={styles.cost}>
                {children}
            </div>
            {upgrade && (
                <div className={styles.upgrade}>
                    <div className={styles.name}>{upgrade.stat}</div>
                </div>
            )}
        </div>
    );
}