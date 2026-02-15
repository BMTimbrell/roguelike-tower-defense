import { useAtom } from 'jotai';
import { mapAtom, rewardsAtom } from '../../store';
import styles from './Rewards.module.css';
import { SKILLS } from '../../constants';
import type { HeroSkillDef, Upgrade } from '../../types';

export default function Rewards() {
    const [map] = useAtom(mapAtom);
    const [rewards, setRewards] = useAtom(rewardsAtom);
    const skills = [...new Set(SKILLS.filter(s => rewards.skills.includes(s.id)))];
    const scale = map.scale;

    function generateRandomRewards(amount: number, rArr: (HeroSkillDef | Upgrade)[]): (HeroSkillDef | Upgrade)[] {
        if (!rArr.length) return [];
        const result = new Set<HeroSkillDef | Upgrade>();

        while (result.size < amount) {
            const index = Math.floor(Math.random() * rArr.length);
            result.add(rArr[index]);
        }
        return [...result];
    }

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.heading}>Choose a Skill</div>
            {generateRandomRewards(3, skills).map((s, index) => (
                <div key={index}>
                    {s.name}
                </div>
            ))}
        </div>
    );
}