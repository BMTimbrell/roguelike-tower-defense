import styles from './UpgradeCard.module.css';
import type { Upgrade } from '../../types';
import UpgradePopup from '../UpgradePopup/UpgradePopup';
import { useState } from 'react';

export default function UpgradeCard({ upgrade, scale, showPopup, fontSize }: { upgrade: Upgrade; scale: number; showPopup?: boolean; fontSize?: number }) {
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const [hovered, setHovered] = useState(false);

    return (
        <>
            <div
                className={styles.upgrade}
                style={{ fontSize: `${(fontSize ? fontSize : 12) * scale}px` }}
                {...(showPopup ? { onMouseEnter: e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setPopupPos && setPopupPos({
                        x: rect.x,
                        y: rect.y - 25 * scale
                    });
                    setHovered(true);
                }} : {})}
                {...(showPopup ? { onMouseLeave: () => setHovered(false) }: {})}
            >
                <div className={styles.icon}>
                    <img width={`${16 * scale}px`} src={upgrade.icon} />
                    <div>+{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
                </div>
                <div>Cost: {upgrade.cost}</div>
            </div>

            {showPopup && hovered && <UpgradePopup upgrade={upgrade} pos={popupPos} />}
        </>
    );
}