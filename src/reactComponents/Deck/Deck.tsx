import type { Deck, Upgrade } from '../../types';
import styles from './Deck.module.css';
import CostText from '../CostText/CostText';
import { challengesAtom, gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { useLayoutEffect, useRef, useState } from 'react';
import Modal from '../Modal/Modal';
import DeckUI from '../DeckUI/DeckUI';
import { UPGRADES } from '../../constants';
import UpgradePopup from '../UpgradePopup/UpgradePopup';


export default function Deck({ deck, gold }: { deck: Deck, gold: number }) {
    const [map] = useAtom(mapAtom);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [challenges] = useAtom(challengesAtom);
    const [hovered, setHovered] = useState(false);
    const scale = map.iconScale;
    const fontScale = map.fontScale;
    const cantAfford = deck.drawCost > gold;
    const challengesVisible = !gameState.challengeManager?.getChallenge() && challenges.visible;
    const deckRef = useRef<HTMLDivElement>(null);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const [card, setCard] = useState<Upgrade>(UPGRADES[0]);
    const [showCardLoadout, setShowCardLoadout] = useState(false);
    const upgradePopup = <UpgradePopup upgrade={card} pos={popupPos} />;
    const [cardHovered, setCardHovered] = useState(false);

    useLayoutEffect(() => {
        const el = deckRef.current;
        if (!el) return;

        const update = () => {
            setGameState(prev => ({
                ...prev,
                deck: {
                    ...prev.deck,
                    pos: deckRef.current?.getBoundingClientRect() ?? undefined
                }
            }));
        };

        update();

        const observer = new ResizeObserver(update);
        observer.observe(el);

        window.addEventListener("resize", update);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, []);

    const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 2) {
            setShowCardLoadout(true);
        }
    };

    return (
        <>
            <div
                ref={deckRef}
                className={styles.deck}
                {...(cantAfford || challengesVisible ? {} : { onClick: deck.drawCard })}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onMouseDown={handleRightClick}
            >
                <div className={styles.card1}></div>
                <div className={styles.card2}></div>
                <div className={styles.card3}></div>
                <div className={`${styles["top-card"]} ${cantAfford ? styles['cant-afford'] : ''}`}>
                    <div className={styles.label}>
                        {deck.drawCost ? (
                            <>
                                <img style={{ width: `${16 * scale}px`, height: `${16 * scale}px` }} src={'./sprites/coin.png'} />
                                <div><CostText cost={deck.drawCost} /></div>
                            </>
                        ) : <>Free</>}

                    </div>
                </div>
                {hovered && (
                    <div style={{ fontSize: `${14 * fontScale}px` }} className={styles.icon}>
                        <img width="32" src="sprites/right-click-icon.png" />
                        <div>View Deck</div>
                    </div>
                )}
            </div>

            <Modal isOpen={showCardLoadout} onClose={() => setShowCardLoadout(false)}>
                <DeckUI setHovered={setCardHovered} setPopupPos={setPopupPos} setCard={setCard} />
            </Modal>
            {cardHovered && upgradePopup}
        </>
    );
}