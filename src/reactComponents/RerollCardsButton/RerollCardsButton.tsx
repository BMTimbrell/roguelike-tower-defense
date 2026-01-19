import { gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import styles from './RerollCardsButton.module.css';
import CostText from '../CostText/CostText';

export default function RerollCardsButton() {
    const [gameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const { roll, baseCost } = gameState.reroll;
    const [disabled, setDisabled] = useState(false);
    const cardCount = gameState.upgrades.length;
    const cost = baseCost * cardCount;

    useEffect(() => {
        setDisabled(cost > gameState.gold || !cardCount);
    }, [gameState.upgrades, gameState.gold]);

    return (
        <div className={styles.container}>
            <button
                className={`${styles.button} ${disabled ? styles["cant-afford"] : ''}`}
                style={{ width: `${32 * scale}px`, height: `${32 * scale}px` }}
                onClick={roll}
                disabled={disabled}
            >
                <img width="100%" src="sprites/dice.png" />
            </button>

            <div className={styles.cost}>
                <img style={{ width: `${16 * scale}px`, height: `${16 * scale}px` }} src="sprites/coin.png" />
                <div><CostText cost={cost} /></div>
            </div>
        </div>
    );
}