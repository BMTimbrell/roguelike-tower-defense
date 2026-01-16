import React, { useRef, useLayoutEffect, useState } from "react";
import styles from './Popup.module.css';
import { mapAtom } from '../../store';
import { useAtom } from 'jotai';

export default function Popup({ mode, pos, children }: { mode: "world" | "screen" ; pos: { x: number; y: number; }, children: React.ReactNode }) {
    const popupRef = useRef<HTMLDivElement | null>(null);
    const [map] = useAtom(mapAtom);
    const [yOffset, setYOffset] = useState(0);
    const scale = map.scale;

    useLayoutEffect(() => {
        const el = popupRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const padding = 8;

        const overflowBottom = rect.bottom - window.innerHeight + padding;

        if (overflowBottom > 0) {
            setYOffset(-overflowBottom);
        } else {
            setYOffset(0);
        }

    }, [pos.x, pos.y, scale]);

    return (
        <div
            ref={popupRef}
            className={styles.container}
            style={{
                '--x': mode === "world" ? `calc(${map.x}px + ${pos.x} * ${scale}px)` : `${pos.x}px`,
                '--y': mode === "world" ? `calc(${map.y}px + ${pos.y} * ${scale}px + ${yOffset}px)` : `${pos.y}px`,
                fontSize: `calc(16px * ${scale})`
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
}