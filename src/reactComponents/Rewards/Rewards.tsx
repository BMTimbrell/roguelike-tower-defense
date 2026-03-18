import { useAtom } from 'jotai';
import { gameStateAtom, mapAtom, rewardsAtom } from '../../store';
import styles from './Rewards.module.css';
import { SKILLS, TOWERS, UPGRADES, type TowerId } from '../../constants';
import Card from '../Card/Card';
import setCardAnimationDelay from '../../utils/setCardAnimationDelay';
import { useMemo, useState } from 'react';
import type { HeroSkillDef, TowerDef, Upgrade } from '../../types';
import UpgradeCard from '../UpgradeCard/UpgradeCard';
import UpgradePopup from '../UpgradePopup/UpgradePopup';
import TowerCard from '../TowerCard/TowerCard';

export default function Rewards() {
    const [map] = useAtom(mapAtom);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [rewards, setRewards] = useAtom(rewardsAtom);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const heading = rewards.show[rewards.rewardIndex] === "skills" ?
        <div className={styles.heading}>Choose a Skill</div> : rewards.show[rewards.rewardIndex] === "upgrades" ?
            <div className={styles.heading}>Choose an Upgrade</div> :
            <div className={styles.heading}>Choose a Tower</div>;

    const scale = map.scale;

    const skills = useMemo(
        () => [...new Set(SKILLS.filter(s => rewards.skills.includes(s.id)))],
        [rewards.skills]
    );
    const rewardSkills = useMemo(
        () => generateRandomRewards(3, skills),
        [skills]
    );

    const upgrades = useMemo(
        () => generateRandomRewards(3, [...new Set(UPGRADES.filter(u => u.cost === 2))]),
        []
    );

    const towers = useMemo(
        () => generateRandomRewards(3, [
            ...new Set(
                Object.entries(TOWERS).
                    filter(([, value]) => value.footprint.w === 2 && !gameState.towerButtons.
                        some(tb => tb.name === value.name)
                    ).map(([key, value]) => ({ [key]: value }))
            )
        ]),
        [gameState.towerButtons]
    );

    function generateRandomRewards<T extends HeroSkillDef | Upgrade | Record<string, TowerDef>>(amount: number, rArr: T[]): T[] {
        if (!rArr.length) return [];
        const result = new Set<T>();

        while (result.size < Math.min(amount, rArr.length)) {
            const index = Math.floor(Math.random() * rArr.length);
            result.add(rArr[index]);
        }
        return [...result];
    }

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            {heading}
            <div className={styles["card-container"]}>
                {rewards.show[rewards.rewardIndex] === "skills" && rewardSkills.map((s, index) => (
                    <Card key={index} animationDelay={setCardAnimationDelay(index)} handleClick={() => rewards.addSkill(s.id)} scale={scale}>
                        <div className={styles["card-contents"]}>
                            <div className={styles.name}>
                                <img width={`${32 * scale}`} src={s.icon} />
                                {s.name}
                            </div>
                            <div>
                                {s.description}
                            </div>
                        </div>
                    </Card>
                ))}

                {rewards.show[rewards.rewardIndex] === "upgrades" && upgrades.map((u, index) => (
                    <Card
                        key={index}
                        animationDelay={setCardAnimationDelay(index)}
                        handleClick={() => {
                            setGameState(prev => ({
                                ...prev,
                                deck: {
                                    ...prev.deck,
                                    cards: [...prev.deck.cards, u]
                                }
                            }));

                            setRewards(prev => ({
                                ...prev,
                                rewardIndex: prev.rewardIndex + 1
                            }));
                         }}
                        scale={scale}
                        popup={<UpgradePopup upgrade={u} pos={popupPos} />}
                        setPopupPos={setPopupPos}
                    >
                        <div className={styles["card-contents"]}>
                            <UpgradeCard key={index} upgrade={u} scale={scale} />
                        </div>
                    </Card>
                ))}

                {rewards.show[rewards.rewardIndex] === "towers" && towers.map((t, index) => (
                    <Card
                        key={index}
                        animationDelay={setCardAnimationDelay(index)}
                        handleClick={() => {
                            rewards.addTower(Object.keys(t)[0] as TowerId);
                         }}
                        scale={scale}
                    >
                        <div className={styles["card-contents"]}>
                            <TowerCard key={index} id={Object.keys(t)[0] as TowerId} scale={scale} />
                        </div>
                    </Card>
                ))}
            </div>

        </div>
    );
}