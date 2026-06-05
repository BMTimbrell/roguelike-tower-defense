import type { Upgrade } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import UpgradePopup from "../UpgradePopup/UpgradePopup";
import Card from "../Card/Card";
import UpgradeCard from "../UpgradeCard/UpgradeCard";

export default function Upgrades({ upgrades }: { upgrades: Upgrade[] }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [overlap, setOverlap] = useState(0);

    const handleClick = (upgrade: Upgrade) => {
        setGameState(prev => ({
            ...prev,
            selectedUpgrade: upgrade
        }));
    };

    const handleRightClick = (e: React.MouseEvent<HTMLDivElement>, upgrade: Upgrade) => {
        if (e.button === 2) {
            upgrade.markedForDeletion = !upgrade.markedForDeletion;
            // handleClick(upgrade);
        }
    };

    const removeUpgrade = (upgrade: Upgrade) => {
        if (gameState.selectedUpgrade === upgrade) {
            setGameState(prev => ({
                ...prev,
                selectedUpgrade: null
            }));
        }

        setGameState(prev => ({
            ...prev,
            upgrades: prev.upgrades.filter(u => u !== upgrade)
        }));
    }

    const calculateOverlap = () => {
        const el = containerRef.current;
        if (!el) return;

        const children = Array.from(el.children) as HTMLElement[];

        if (children.length <= 1) {
            setOverlap(0);
            return;
        }

        const style = window.getComputedStyle(el);
        const gap = parseFloat(style.columnGap);

        const containerWidth = el.clientWidth;

        const cardsWidth = children.reduce(
            (sum, child) => sum + child.offsetWidth,
            0
        );

        const gaps = children.length - 1;

        const totalWidthWithGap = cardsWidth + gap * gaps;
        const overflow = totalWidthWithGap - containerWidth;

        setOverlap(
            overflow > 0
                ? overflow / gaps
                : 0
        );
    };

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver(() => {
            calculateOverlap();
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        calculateOverlap();

        const maxDelay = Math.max(
            0,
            ...upgrades.map(u => u.animationDelay ?? 0)
        );

        const timeout = setTimeout(
            calculateOverlap,
            maxDelay + 600
        );

        return () => clearTimeout(timeout);
    }, [upgrades, map.fontScale, map.iconScale]);

    useEffect(() => {
        const handler = (e: MouseEvent) => e.preventDefault();

        document.addEventListener("contextmenu", handler);

        return () => {
            document.removeEventListener("contextmenu", handler);
        };
    }, []);


    return (
        <div
            ref={containerRef}
            className={styles.container}
            style={{ "--overlap": `${overlap}px` } as React.CSSProperties}
        >
            {upgrades.map((upgrade, index) => (
                <Card
                    key={`${index}${gameState.reroll.rerollCount}`}
                    popup={!upgrade.markedForDeletion ? <UpgradePopup upgrade={upgrade} pos={popupPos} /> : undefined}
                    setPopupPos={setPopupPos}
                    scale={fontScale}
                    {...(upgrade?.animationDelay ? { animationDelay: upgrade.animationDelay } : {})}
                    classNames={[gameState.selectedUpgrade === upgrade ? styles.selected : '', upgrade.markedForDeletion ? styles["marked-for-deletion"] : '']}
                    handleRightClick={(e) => handleRightClick(e, upgrade)}
                    handleClick={() => upgrade.markedForDeletion ? removeUpgrade(upgrade) : handleClick(upgrade)}
                >
                    {upgrade.markedForDeletion ? "Remove" : <UpgradeCard upgrade={upgrade} scale={fontScale} />}
                </Card>
            ))}
        </div>
    );
}