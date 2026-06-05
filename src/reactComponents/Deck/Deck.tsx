import type { Deck } from '../../types';
import styles from './Deck.module.css';
import CostText from '../CostText/CostText';
import { challengesAtom, gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { useLayoutEffect, useRef } from 'react';


export default function Deck({ deck, gold }: { deck: Deck, gold: number }) {
    const [map] = useAtom(mapAtom);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [challenges] = useAtom(challengesAtom);
    const scale = map.iconScale;
    const cantAfford = deck.drawCost > gold;
    const challengesVisible = !gameState.challengeManager?.getChallenge() && challenges.visible;
    const deckRef = useRef<HTMLDivElement>(null);

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

    return (
        <>
            <div ref={deckRef} className={styles.deck} {...(cantAfford || challengesVisible ? {} : { onClick: deck.drawCard })}>
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
            </div>
        </>
    );
}