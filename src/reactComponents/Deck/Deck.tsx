import type { Deck } from '../../types';
import styles from './Deck.module.css';
import CostText from '../CostText/CostText';
import { challengesAtom, gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';


export default function Deck({ deck, gold }: { deck: Deck, gold: number }) {
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const [challenges] = useAtom(challengesAtom);
    const scale = map.scale;
    const cantAfford = deck.drawCost > gold;
    const challengesVisible = !gameState.challengeManager?.getChallenge() && challenges.visible;

    return (
        <>
            <div className={styles.deck} {...(cantAfford || challengesVisible ? {} : { onClick: deck.drawCard })}>
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