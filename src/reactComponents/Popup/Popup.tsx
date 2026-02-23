import React, { useRef, useLayoutEffect, useState } from "react";
import styles from './Popup.module.css';
import { mapAtom } from '../../store';
import { useAtom } from 'jotai';

export default function Popup({ mode, pos, children, pStyle }: {
    mode: "world" | "screen";
    pos: { x: number; y: number; };
    children: React.ReactNode;
    pStyle?: React.CSSProperties
}) {
    const popupRef = useRef<HTMLDivElement | null>(null);
    const [map] = useAtom(mapAtom);
    const [y, setY] = useState(pos.y);
    const [x, setX] = useState(pos.x);
    const scale = map.scale;

    useLayoutEffect(() => {
        const el = popupRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const padding = 8;

        if (mode === "world") {
            if (pos.y * scale + rect.height > window.innerHeight - padding) {
                setY(window.innerHeight - rect.height - padding);

            } else if (pos.y < 0) {
                setY(0);
            } else {
                setY(pos.y * scale);
            }

            if (pos.x * scale + rect.width > window.innerWidth - padding) {
                setX(window.innerWidth - rect.width - padding);
            } else if (pos.x < 0) {
                setX(0);
            } else {
                setX(pos.x * scale);
            }
            return;
        }

        if (pos.y + rect.height > window.innerHeight - padding) {
            setY(window.innerHeight - rect.height - padding);

        } else if (pos.y < 0) {
            setY(0);
        } else {
            setY(pos.y);
        }

        if (pos.x + rect.width > window.innerWidth - padding) {
            setX(window.innerWidth - rect.width - padding);
        } else if (pos.x < 0) {
            setX(0);
        } else {
            setX(pos.x);
        }

    }, [pos.x, pos.y, scale]);

    return (
        <div
            ref={popupRef}
            className={styles.container}
            style={{
                '--x': `${x}px`,
                '--y': `${y}px`,

                fontSize: `calc(16px * ${scale})`,
                ...pStyle
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
}