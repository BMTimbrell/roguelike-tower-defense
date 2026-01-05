import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import styles from './CostText.module.css';

export default function CostText({ cost }: { cost: number }) {
    const [gameState] = useAtom(gameStateAtom);
    const gold = gameState.gold;

    return (
        <span className={gold < cost ? styles["cant-afford"] : ''}>
            {cost}
        </span>
    );
}