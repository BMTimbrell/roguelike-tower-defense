import React, { useRef, useLayoutEffect, useState } from "react";
import styles from './Popup.module.css';
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { TILE_SIZE } from "../../constants";

export default function Popup({ mode, pos, children, pStyle }: {
    mode: "world" | "screen";
    pos: { x: number; y: number; };
    children: React.ReactNode;
    pStyle?: React.CSSProperties
}) {
    const popupRef = useRef<HTMLDivElement | null>(null);
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const [y, setY] = useState(pos.y);
    const [x, setX] = useState(pos.x);
    const scale = map.iconScale;
    const fontScale = map.fontScale;

    useLayoutEffect(() => {
        const el = popupRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const verticalPadding =
            mode === "world"
                ? TILE_SIZE * (
                    (
                        gameState.towerButtons.length > 6 ||
                        (
                            gameState.towerButtons.length === 6 &&
                            !gameState.context?.get("hero").length
                        )
                    ) ? 4 : 2
                ) * fontScale
                : 0;
        const horizontalPadding = 8;

        if (pos.y + rect.height > window.innerHeight - verticalPadding) {
            setY(window.innerHeight - rect.height - verticalPadding);
        } else if (pos.y < 0) {
            setY(0);
        } else {
            setY(pos.y);
        }

        if (pos.x + rect.width > window.innerWidth - horizontalPadding) {
            setX(window.innerWidth - rect.width - horizontalPadding);
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

                fontSize: `calc(16px * ${fontScale})`,
                ...pStyle
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
}