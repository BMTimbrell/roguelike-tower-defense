import { useAtom } from 'jotai';
import { mapAtom, rewardsAtom } from '../../store';
import styles from './Rewards.module.css';
import { SKILLS } from '../../constants';
import Card from '../Card/Card';
import setCardAnimationDelay from '../../utils/setCardAnimationDelay';
import { useMemo } from 'react';

export default function Rewards() {
    const [map] = useAtom(mapAtom);
    const [rewards, setRewards] = useAtom(rewardsAtom);
    const skills = useMemo(
        () => [...new Set(SKILLS.filter(s => rewards.skills.includes(s.id)))],
        [rewards.skills]
    );
    const scale = map.scale;
    const rewardSkills = useMemo(
        () => generateRandomRewards(3, skills),
        [skills]
    );

    function generateRandomRewards<T>(amount: number, rArr: T[]): T[] {
        if (!rArr.length) return [];
        const result = new Set<T>();

        while (result.size < Math.min(amount, rArr.length)) {
            const index = Math.floor(Math.random() * rArr.length);
            result.add(rArr[index]);
        }
        return [...result];
    }

    const handleClick = () => { };

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.heading}>Choose a Skill</div>
            <div className={styles["card-container"]}>
                {rewardSkills.map((s, index) => (
                    <Card key={index} animationDelay={setCardAnimationDelay(index)} handleClick={handleClick} scale={scale}>
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
            </div>
        </div>
    );
}