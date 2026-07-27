import type { Card as GameCard } from "../../types";
import styles from "./Upgrades.module.css";
import { gameStateAtom, mapAtom, store } from '../../store';
import { useAtom } from 'jotai';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import UpgradePopup from "../UpgradePopup/UpgradePopup";
import Card from "../Card/Card";
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import SpellCard from "../SpellCard/SpellCard";
import { castSpell } from "../../utils/spellHelpers";
import SpellPopup from "../SpellPopup/SpellPopup";
import { TILE_SIZE } from "../../constants";

export default function Upgrades({ cards }: { cards: GameCard[] }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [overlap, setOverlap] = useState(0);
    const [hoveredCard, setHoveredCard] = useState<GameCard | null>(null);

    const handleClick = (card: GameCard) => {
        setGameState(prev => ({
            ...prev,
            selectedUpgrade: card
        }));

        if (!gameState.context) return;

        if ("type" in card) {
            if (card.target === "none" || card.target === "auto-consume") {
                castSpell(gameState.context, card);
                if (!card.uses) removeCard(card);
                setGameState(prev => ({
                    ...prev,
                    selectedUpgrade: null
                }));
            } else if (card.target === "point") {
                const range = card.range ?? 3;
                const k = gameState.context;
                const rangeCircle = k.add([
                    k.pos(),
                    k.color(110, 220, 255),
                    k.circle(range * TILE_SIZE),
                    k.outline(1),
                    k.opacity(0.2),
                    "spell range",
                    {
                        update() {
                            rangeCircle.pos = k.toWorld(k.mousePos());
                            if (store.get(gameStateAtom).selectedUpgrade !== card) {
                                k.destroy(rangeCircle);
                            }
                        }
                    },
                    k.z(999)
                ]);
            }
        }
    };

    const handleRightClick = (e: React.MouseEvent<HTMLDivElement>, upgrade: GameCard) => {
        if (e.button === 2) {
            setGameState(prev => ({
                ...prev,
                upgrades: prev.upgrades.map(u => u !== upgrade ? u : { ...u, markedForDeletion: !u.markedForDeletion })
            }));

            upgrade.markedForDeletion = !upgrade.markedForDeletion;
            if (gameState.selectedUpgrade === upgrade) {
                setGameState(prev => ({
                    ...prev,
                    selectedUpgrade: null
                }));
            }
        }
    };

    const removeCard = (upgrade: GameCard) => {
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
            ...cards.map(u => u.animationDelay ?? 0)
        );

        const timeout = setTimeout(
            calculateOverlap,
            maxDelay + 600
        );

        return () => clearTimeout(timeout);
    }, [cards, map.fontScale, map.iconScale]);

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
            {cards.map((card, index) => (
                <Card
                    key={`${index}${gameState.handVersion}`}
                    popup={!("type" in card) && !card.markedForDeletion ? <UpgradePopup upgrade={card} pos={popupPos} /> : ("type" in card) && !card.markedForDeletion ? <SpellPopup pos={popupPos} description={card.description} /> : undefined}
                    setPopupPos={setPopupPos}
                    noPadding={"type" in card}
                    scale={fontScale}
                    {...(card?.animationDelay ? { animationDelay: card.animationDelay } : {})}
                    classNames={[
                        gameState.selectedUpgrade === card ? styles.selected : '',
                        "markedForDeletion" in card && card.markedForDeletion ? styles["marked-for-deletion"] : '',
                        "type" in card && card.type === "spell" ? styles.spell : '']}
                    handleRightClick={(e) => handleRightClick(e, card)}
                    handleClick={() => "markedForDeletion" in card && card.markedForDeletion ? removeCard(card) : handleClick(card)}
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    {"markedForDeletion" in card && card.markedForDeletion ? "Remove" : !("type" in card) ? <UpgradeCard upgrade={card} scale={fontScale} /> : <SpellCard icon={card.icon} uses={card.uses ?? 0} iconScale={1} />}
                    {hoveredCard === card && !card.markedForDeletion && (
                        <div style={{ fontSize: `${14 * fontScale}px` }} className={styles["icon-container"]}>
                            <div className={styles.icon}>
                                <img width="32" src="sprites/left-click-icon.png" />
                                <div>{"target" in card ? card.target === "none" || card.target === "auto-consume" ? "Use" : "Select" : "Select"}</div>
                            </div>
                            <div className={styles.icon}>
                                <img width="32" src="sprites/right-click-icon.png" />
                                <div>Remove</div>
                            </div>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}