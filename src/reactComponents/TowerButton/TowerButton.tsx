import styles from './TowerButton.module.css';
import { type MouseEventHandler } from 'react';
import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';

export default function TowerButton(
    {
        name,
        scale,
        onClick,
        cost
    }: {
         name: string,
         scale: number,
         onClick: MouseEventHandler<HTMLButtonElement>
         cost: number
    }
) {
    const [gameState] = useAtom(gameStateAtom);
    const cantAfford = gameState.gold < cost;

    return (
        <button 
            style={{
                fontSize: `calc(16px * ${scale})`
            }}
            className={styles.tower}
            onClick={onClick}
            disabled={cantAfford}
        >
            {name}
        </button>
    );
}