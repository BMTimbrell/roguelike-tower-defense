import { mapAtom, gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import TowerButton from '../TowerButton/TowerButton';
import Upgrades from '../Upgrades/Upgrades';
import styles from './BottomBar.module.css';
import Deck from '../Deck/Deck';
import HeroButton from '../HeroButton/HeroButton';
import { HEROES } from '../../constants';

export function BottomBar() {
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const { towerButtons, upgrades } = gameState;

    return (
        <div
            style={{
                bottom: `${map.y}px`,
                fontSize: `calc(16px * ${map.scale})`
            }}
            className={styles.container}
        >
            <div className={styles["bottom-bar"]}>
                <div className={styles["tower-container"]}>
                    {gameState.heroButton.visible && gameState.hero && <HeroButton
                        onClick={() => { gameState.heroButton.onClick() }}
                        sprite={`/sprites/${HEROES[gameState.hero.heroId].sprite}`}
                        charge={gameState.heroCharge.charge}
                    />}
                    {towerButtons.map((t, index) => (
                        <TowerButton
                            key={index}
                            id={t.id}
                            name={t.name}
                            stats={t.stats}
                            description={t.description}
                            scale={map.scale}
                            onClick={t.onClick}
                            cost={t.cost}
                            sprite={t.sprite}
                            element={t.element}
                        />
                    ))}
                </div>

                <Upgrades upgrades={upgrades} />

                <div className={styles["right-container"]}>
                    <Deck deck={gameState.deck} gold={gameState.gold} />
                </div>
            </div>
        </div>
    );
}