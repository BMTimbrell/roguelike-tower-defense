import { mapAtom, gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import TowerButton from '../TowerButton/TowerButton';
import Upgrades from '../Upgrades/Upgrades';
import styles from './BottomBar.module.css';
import Deck from '../Deck/Deck';
import RerollCardsButton from '../RerollCardsButton/RerollCardsButton';

export function BottomBar() {
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const { towerButtons, upgrades } = gameState;
    const tileSize = 32;

    return (
        <div
            style={{
                left: `${map.x}px`,
                bottom: `${map.y}px`,
                width: `calc(100% - ${map.x}px * 2)`,
                height: `calc(2 * ${tileSize} * ${map.scale}px)`,
                fontSize: `calc(16px * ${map.scale})`
            }}
            className={styles.container}
        >
            {towerButtons.map((t, index) => (
                <TowerButton
                    key={index}
                    name={t.name}
                    stats={t.stats}
                    scale={map.scale}
                    onClick={t.onClick}
                    cost={t.cost}
                />
            ))}

            <Upgrades upgrades={upgrades} />
            <RerollCardsButton  />
            <Deck deck={gameState.deck} gold={gameState.gold} />
        </div>
    );
}