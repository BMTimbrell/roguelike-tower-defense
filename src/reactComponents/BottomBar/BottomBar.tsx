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
    const fontScale = map.fontScale;

    return (
        <div
            style={{
                bottom: `${0}px`,
                fontSize: `calc(16px * ${fontScale})`
            }}
            className={styles.container}
        >
            <div className={styles["bottom-bar"]}>
                <div className={styles["tower-container"]}>
                    {gameState.heroButton.visible && gameState.hero && <HeroButton
                        onClick={() => { gameState.heroButton.onClick() }}
                        sprite={`sprites/${HEROES[gameState.hero.heroId].sprite}`}
                        charge={gameState.heroCharge.charge}
                    />}
                    {towerButtons.map((t, index) => (
                        <TowerButton
                            key={index}
                            scale={map.fontScale}
                            tower={t}
                        />
                    ))}
                </div>

                <Upgrades cards={upgrades} />

                <div className={styles["right-container"]}>
                    <Deck deck={gameState.deck} gold={gameState.gold} />
                </div>
            </div>
        </div>
    );
}