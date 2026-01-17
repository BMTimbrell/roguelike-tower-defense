import type { Upgrade } from "../../types";
import styles from "./UpgradeSlot.module.css";
import { useRef, useState } from 'react';
import { mapAtom } from '../../store';
import { useAtom } from 'jotai';
import UpgradePopup from "../UpgradePopup/UpgradePopup";

type UpgradeSlotProps = {
    upgrade: Upgrade | null;
    selectedUpgrade: Upgrade | null;
    unlocked: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    highlighted: boolean;
    active: boolean;
};

export default function UpgradeSlot({ upgrade, selectedUpgrade, unlocked, onClick, children, highlighted, active }: UpgradeSlotProps) {
    const slotRef = useRef<HTMLDivElement | null>(null);
    const [popup, setPopup] = useState(false);
    const [pos, setPos] = useState<{ x: number; y: number; } | null>(null);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;

    return (
        <>
            <div
                ref={slotRef}
                onClick={onClick}
                onMouseEnter={() => {
                    if (slotRef.current) setPos({
                        x: slotRef.current.getBoundingClientRect().x,
                        y: slotRef.current.getBoundingClientRect().y - 35 * scale
                    });
                    setPopup(true);
                }}
                onMouseLeave={() => setPopup(false)}
                className={`${styles.slot} ${!unlocked ? styles.locked : ''} ${highlighted ? styles.highlighted : ''}`}
            >
                {!unlocked && <div className={styles.cost}>
                    {children}
                </div>}
                {selectedUpgrade && highlighted && <img src={selectedUpgrade.icon} />}
                {upgrade && (
                    <div className={`${styles.upgrade} ${active && upgrade.cost > 1 ? styles[`multi-slot${upgrade.cost}`] : ''}`}>
                        <img src={upgrade.icon} />
                    </div>
                )}
            </div>

            {popup && upgrade && <UpgradePopup upgrade={upgrade} pos={pos} />}
        </>
    );
}