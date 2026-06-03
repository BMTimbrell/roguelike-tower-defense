import type { Upgrade } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { useState, useRef, useLayoutEffect } from 'react';
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
            handleClick(upgrade);
        }
    };

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    const removeUpgrade = (upgrade: Upgrade) => {
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

        // temporarily disable overlap so we measure natural layout
        el.style.setProperty("--overlap", "0px");

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

        if (overflow <= 0) {
            setOverlap(0);
            return;
        }

        setOverlap(overflow / gaps);
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
    }, [upgrades, map.fontScale, map.iconScale]);

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