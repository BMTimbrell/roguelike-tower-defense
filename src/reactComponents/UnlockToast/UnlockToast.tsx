import { useEffect, useState } from "react";
import { mapAtom, unlockToastAtom } from "../../store";
import { useAtom } from "jotai";
import styles from './UnlockToast.module.css';

export default function UnlockToast() {
    const [queue, setQueue] = useAtom(unlockToastAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.fontScale;
    const [visible, setVisible] = useState(true);

    const unlock = queue[0];

    useEffect(() => {
        if (!unlock) return;

        setVisible(true);

        const fadeTimer = setTimeout(() => {
            setVisible(false);
        }, 2500);

        const removeTimer = setTimeout(() => {
            setQueue(q => q.slice(1));
        }, 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [unlock]);

    if (!unlock) return null;

    return (
        <div style={{ fontSize: `${16 * scale}px` }} className={`${styles["unlock-toast"]} ${visible ? styles.show : styles.hide}`}>
            <img width={32 * map.iconScale} src={`sprites/${unlock.icon}`} />
            <div>
                <div>New Hero Unlocked!</div>
                <div>{unlock.name}</div>
            </div>
        </div>
    );
}