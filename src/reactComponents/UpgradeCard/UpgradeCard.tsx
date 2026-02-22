import styles from './UpgradeCard.module.css';
import type { Upgrade } from '../../types';

export default function UpgradeCard({ upgrade, scale }: { upgrade: Upgrade; scale: number; }) {

    return (
        <div className={styles.upgrade} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.icon}>
                <img width={`${32 * scale}px`} src={upgrade.icon} />
                <div>+{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
            </div>
            <div>Cost: {upgrade.cost}</div>
        </div>
    );
}