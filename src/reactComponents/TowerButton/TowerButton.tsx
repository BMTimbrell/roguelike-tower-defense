import styles from './TowerButton.module.css';
import { type MouseEventHandler } from 'react';
import { gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import type { TowerStats, ElementName } from '../../types';
import CostText from '../CostText/CostText';
import { ELEMENTS } from '../../constants';
import DescriptionPopup from '../DescriptionPopup/DescriptionPopup';
import { useTowerPopup } from '../../reactHooks/useTowerPopup';
import TowerPopup from '../TowerPopup/TowerPopup';

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
        name: string;
        scale: number;
        onClick: MouseEventHandler<HTMLButtonElement>;
        cost: number;
        stats: TowerStats;
        element: ElementName;
        sprite: string;
        description: string;
    }
) {
    const [gameState] = useAtom(gameStateAtom);
    const popup = useTowerPopup(scale, !!ELEMENTS[element].description);
    const disabled = gameState.gold < cost;

    return (
        <>
            <button
                {...popup.getTriggerProps<HTMLButtonElement>()}
                style={{
                    fontSize: `calc(12px * ${scale})`
                }}
                className={`${styles.button} ${disabled ? styles.disabled : ''}`}
                onClick={disabled ? () => null : onClick}
            >
                <img width={`${32 * scale}`} src={`/sprites/${sprite}`} />
                <CostText cost={cost} />
            </button>

            {popup.showBase &&
                <TowerPopup
                    ref={popup.popupRef}
                    name={name}
                    element={element}
                    description={description}
                    stats={stats}
                    cost={cost}
                    pos={popup.basePos}
                    scale={scale}
                />
            }

            {popup.showElement && (
                <DescriptionPopup pos={popup.elementPos}>
                    {ELEMENTS[element].description}
                </DescriptionPopup>
            )}
        </>
    );
}