import { useLayoutEffect, useRef, useState } from "react";
import Popup from "../Popup/Popup";
import styles from './SpellPopup.module.css';

export default function SpellPopup({
    pos,
    description
}: {
    pos: { x: number; y: number; } | null;
    description: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [popupHeight, setPopupHeight] = useState(0);

    useLayoutEffect(() => {
        if (ref.current) {
            setPopupHeight(ref.current.parentElement?.getBoundingClientRect().height ?? 0);
        }

        return () => setPopupHeight(0);
    }, [description]);

    return (
        <Popup mode="screen" pos={{ x: pos?.x || 0, y: (pos?.y ?? 0) - (popupHeight || 0) - 8 }}>
            <div ref={ref} className={styles.description}>
                {description}
            </div>
        </Popup>
    );
}