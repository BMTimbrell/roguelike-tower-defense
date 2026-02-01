import styles from './TowerButton.module.css';
import { type MouseEventHandler, useState, useRef, useLayoutEffect } from 'react';
import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import Popup from '../Popup/Popup';
import type { TowerStats, ElementName } from '../../types';
import CostText from '../CostText/CostText';
import { ELEMENTS } from '../../constants';

export default function TowerButton(
    {
        name,
        scale,
        stats,
        onClick,
        cost,
        description,
        sprite,
        element
    }: {
        name: string,
        scale: number,
        onClick: MouseEventHandler<HTMLButtonElement>
        cost: number,
        stats: TowerStats,
        element: ElementName;
        sprite: string;
        description: string;
    }
) {
    const [gameState] = useAtom(gameStateAtom);
    const [bPopup, setBPopup] = useState(false);
    const [ePopup, setEPopup] = useState(false);
    const disabled = gameState.gold < cost;
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const buttonPopupRef = useRef<HTMLDivElement | null>(null);
    const [bPopupPos, setBPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const [ePopupPos, setEPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const { damage, range, fireInterval, critChance, critDamage } = stats;

    useLayoutEffect(() => {
        if (!bPopup || !buttonPopupRef.current || !buttonRef.current) return;

        const popupRect = buttonPopupRef.current.getBoundingClientRect();
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const padding = 20 * scale;

        setBPopupPos({
            x: buttonRect.x,
            y: buttonRect.y - (popupRect.height + padding),
        });

        setEPopupPos({
            x: buttonRect.x + popupRect.width + padding,
            y: buttonRect.y - (popupRect.height + padding),
        });
    }, [bPopup, scale]);

    return (
        <>
            <button
                ref={buttonRef}
                style={{
                    fontSize: `calc(16px * ${scale})`
                }}
                className={`${styles.button} ${disabled ? styles.disabled : ''}`}
                onClick={disabled ? () => null : onClick}
                onMouseEnter={() => {
                    if (!buttonRef.current) return;

                    const rect = buttonRef.current.getBoundingClientRect();

                    setBPopupPos({
                        x: rect.x,
                        y: rect.y, // corrected after popup renders
                    });

                    setBPopup(true);
                    if (ELEMENTS[element].description) setEPopup(true);
                    
                }}
                onMouseLeave={() => {
                    setBPopup(false);
                    setEPopup(false);
                }}
            >
                <img width={`${32 * scale}`} src={`/sprites/${sprite}`} />
                <CostText cost={cost} />
            </button>

            {bPopup && <Popup mode="screen" pos={{ x: bPopupPos?.x || 0, y: bPopupPos?.y || 0 }}>
                <div className={styles["popup-contents"]} ref={buttonPopupRef}>
                    <div className={styles.name}>{name}</div>

                    <div className={styles.description}>{description}</div>

                    <div className={styles.element}>
                        Element: <span style={{ color: ELEMENTS[element].color }}>{element}</span>
                    </div>

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
                    <div className={styles.cost}>
                        Cost: <img style={{ width: `${8 * scale}px`, marginRight: "0.125em" }} src="sprites/coin.png" />{cost}
                    </div>

                </div>
            </Popup>}

            {ePopup && <Popup mode="screen" pos={{ x: ePopupPos?.x || 0, y: ePopupPos?.y || 0 }}>
                <div className={styles["element-description"]}>
                    {ELEMENTS[element].description}
                </div>
            </Popup>}
        </>
    );
}