import type { Deck } from '../../types';
import styles from './Deck.module.css';
import CostText from '../CostText/CostText';
import { mapAtom } from '../../store';
import { useAtom } from 'jotai';


export default function Deck({ deck, gold }: { deck: Deck, gold: number }) {
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const cantAfford = deck.drawCost > gold;

    return (
        <>
            <div className={styles.deck} {...(cantAfford ? {} : { onClick: deck.drawCard })}>
                <div className={styles.card1}></div>
                <div className={styles.card2}></div>
                <div className={styles.card3}></div>
                <div className={`${styles["top-card"]} ${cantAfford ? styles['cant-afford'] : ''}`}>
                    <div className={styles.label}>
                        <img style={{ width: `${16 * scale}px`, height: `${16 * scale}px` }} src={'./sprites/coin.png'} />
                        <div><CostText cost={deck.drawCost} /></div>
                    </div>
                </div>
            </div>
        </>
    );
}