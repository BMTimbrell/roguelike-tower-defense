import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import styles from './RerollCardsButton.module.css';

export default function RerollCardsButton() {
    const [gameState] = useAtom(gameStateAtom);
    const { roll, baseCost } = gameState.reroll;
    const [disabled, setDisabled] = useState(false);
    const cardCount = gameState.upgrades.length;
    const cost = baseCost * cardCount;

    useEffect(() => {
        setDisabled(cost > gameState.gold || !cardCount);
    }, [gameState.upgrades]);

    return (
        <button
            className={styles.button}
            onClick={roll}
            disabled={disabled}
         >
            Reroll {cost ? cost : ''}
        </button>
    );
}