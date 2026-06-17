import styles from './TowerButton.module.css';
import { type MouseEventHandler } from 'react';
import { challengesAtom, gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import type { TowerStats, ElementName } from '../../types';
import CostText from '../CostText/CostText';
import { ELEMENTS, TOWERS, type TowerId } from '../../constants';
import DescriptionPopup from '../DescriptionPopup/DescriptionPopup';
import { useTowerPopup } from '../../reactHooks/useTowerPopup';
import TowerPopup from '../TowerPopup/TowerPopup';

export default function TowerButton(
    {
        id,
        name,
        scale,
        stats,
        onClick,
        cost,
        description,
        sprite,
        element
    }: {
        id: TowerId;
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
    const [map] = useAtom(mapAtom);
    const iconScale = map.iconScale;
    const [challenges] = useAtom(challengesAtom);
    const popup = useTowerPopup(scale, !!ELEMENTS[element].description);
    const disabled = gameState.gold < cost || (!gameState.challengeManager?.getChallenge() && challenges.visible);

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
                <img width={`${32 * iconScale}`} src={`sprites/${sprite}`} />
                <CostText cost={cost} />

                {TOWERS[id].footprint.w === 2 && <div className={styles.size}>2x2</div>}
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
                    scale={iconScale}
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