import { mapAtom, gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import TowerButton from '../TowerButton/TowerButton';
import Upgrades from '../Upgrades/Upgrades';
import styles from './BottomBar.module.css';
import Deck from '../Deck/Deck';

type props = {
    mouseEnter: () => void;
    mouseExit: () => void;
};

export function BottomBar({ mouseEnter, mouseExit }: props) {
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const { towers, upgrades } = gameState;
    const tileSize = 32;

    return (
        <div
            onMouseEnter={mouseEnter}
            onMouseLeave={mouseExit}
            style={{
                left: `${map.x}px`,
                bottom: `${map.y}px`,
                width: `calc(100% - ${map.x}px * 2)`,
                height: `calc(2 * ${tileSize} * ${map.scale}px)`,
                fontSize: `calc(16px * ${map.scale})`
            }}
            className={styles.container}
        >
            {towers.map((tower, index) => (
                <TowerButton
                    key={index}
                    name={tower.name}
                    scale={map.scale}
                    onClick={tower.onClick}
                    cost={tower.cost}
                />
            ))}

            <Upgrades upgrades={upgrades} />
            <Deck deck={gameState.deck} gold={gameState.gold} />
        </div>
    );
}