import styles from './UpgradeCard.module.css';
import type { Upgrade } from '../../types';
import UpgradePopup from '../UpgradePopup/UpgradePopup';
import { useLayoutEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { mapAtom } from '../../store';

export default function UpgradeCard({ 
    upgrade, 
    scale, 
    showPopup, 
    fontSize, 
    popupOffset,
    setCard 
}: { 
    upgrade: Upgrade; 
    scale: number; 
    showPopup?: boolean; 
    fontSize?: number; 
    popupOffset?: {
        x: number;
        y: number;
    }; 
    setCard?: React.Dispatch<React.SetStateAction<Upgrade>>;
}) {
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const [hovered, setHovered] = useState(false);
    const [map] = useAtom(mapAtom);
    const iconScale = map.iconScale;

    useLayoutEffect(() => {
        if (hovered && setCard) {
            setCard(upgrade);
        }
    }, [hovered, setCard]);

    return (
        <>
            <div
                className={styles.upgrade}
                style={{ fontSize: `${(fontSize ? fontSize : 12) * scale}px` }}
                onMouseEnter={ e => {
                    setHovered(true);
                    if (!showPopup) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    setPopupPos && setPopupPos({
                        x: rect.x - (popupOffset ? popupOffset.x : 0) * scale,
                        y: rect.y - (popupOffset ? popupOffset.y : 0) * scale
                    });
                }}
                onMouseLeave= {() => setHovered(false) }
            >
                <div className={styles.icon}>
                    <img width={`${16 * iconScale}px`} src={upgrade.icon} />
                    <div>+{upgrade.amount}{upgrade.percentage ? '%' : ''}</div>
                </div>
                <div>Cost: {upgrade.cost}</div>
            </div>

            {showPopup && hovered && <UpgradePopup upgrade={upgrade} pos={popupPos} />}
        </>
    );
}