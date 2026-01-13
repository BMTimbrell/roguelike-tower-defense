import type { Deck } from '../../types';
import styles from './Deck.module.css';

export default function Deck({ deck }: { deck: Deck }) {
    
    return(
        <>
            <div className={styles.deck} onClick={deck.drawCard}>
                <div className={styles.card1}></div>
                <div className={styles.card2}></div>
                <div className={styles.card3}></div>
                <div className={styles["top-card"]}>?</div>
            </div>
        </>
    );
}