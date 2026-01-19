import styles from './TowerButton.module.css';
import { type MouseEventHandler, useState, useRef } from 'react';
import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import Popup from '../Popup/Popup';

export default function TowerButton(
    {
        name,
        scale,
        stats,
        onClick,
        cost
    }: {
        name: string,
        scale: number,
        onClick: MouseEventHandler<HTMLButtonElement>
        cost: number,
        stats: {
            damage: number;
            range: number;
            fireInterval: number;
            critChance: number;
            critDamage: number;
        }
    }
) {
    const [gameState] = useAtom(gameStateAtom);
    const [popup, setPopup] = useState(false);
    const cantAfford = gameState.gold < cost;
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [pos, setPos] = useState<{ x: number; y: number; } | null>(null);
    const { damage, range, fireInterval, critChance, critDamage } = stats;

    return (
        <>
            <button
                ref={buttonRef}
                style={{
                    fontSize: `calc(16px * ${scale})`
                }}
                className={styles.button}
                onClick={onClick}
                disabled={cantAfford}
                onMouseEnter={() => {
                    if (buttonRef.current) setPos({
                        x: buttonRef.current.getBoundingClientRect().x,
                        y: buttonRef.current.getBoundingClientRect().y - 150 * scale
                    });
                    setPopup(true);
                }}
                onMouseLeave={() => setPopup(false)}
            >
                {name}
            </button>
            {popup && <Popup mode="screen" pos={{ x: pos?.x || 0, y: pos?.y || 0 }}>
                <div className={styles["popup-contents"]}>
                    <div className={styles.name}>{name}</div>
                    <div className={styles.cost}>Gold Cost: {cost}</div>
                    <div className={styles.stats}>
                        <div>
                            <img width={`${16 * scale}px`} src="sprites/damage-icon.png" />
                            <div>Damage: {damage}</div>
                        </div>
                        <div>
                            <img width={`${16 * scale}px`} src="sprites/firerate-icon.png" />
                            <div>Fire Rate: {(1 / fireInterval).toFixed(1)}/sec</div>
                        </div>
                        <div>
                            <img width={`${16 * scale}px`} src="sprites/range-icon.png" />
                            <div>Range: {range}</div>
                        </div>
                        <div>
                            <img width={`${16 * scale}px`} src="sprites/critchance-icon.png" />
                            <div>Crit Chance: {critChance}%</div>
                        </div>
                        <div>
                            <img width={`${16 * scale}px`} src="sprites/critdamage-icon.png" />
                            <div>Crit Damage: {critDamage}%</div>
                        </div>
                    </div>
                </div>
            </Popup>}
        </>
    );
}