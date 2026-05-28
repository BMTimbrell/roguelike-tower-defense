import { useAtom } from "jotai";
import { mapAtom } from "../../store";
import type { SelectedHeroUI } from "../../types";
import Popup from "../Popup/Popup";
import PriorityButton from "../PriorityButton/PriorityButton";
import styles from "./SelectedHero.module.css";
import Stats from "../Stats/Stats";
import SkillIcon from "../SkillIcon/SkillIcon";
import { SKILLS } from "../../constants";

export default function SelectedHero({ hero }: { hero: SelectedHeroUI }) {
    const {
        name,
        priority,
        stats,
        pos,
        element,
        level,
        skillIds,
        setPriority
    } = hero;

    const [map] = useAtom(mapAtom);
    const iconScale = map.iconScale;
    const skills = [...new Set(SKILLS.filter(s => skillIds.includes(s.id)))];

    return (
        <Popup mode="world" pos={pos}>
            <div className={styles.name}>
                <div>{name}</div>
                <div className={styles.level}>Level {level}</div>
            </div>
            <div className={styles.skills}> Skills:
                {skills.map((s, index) => (
                    <SkillIcon key={index} src={s.icon} scale={iconScale} description={s.description} />
                ))}
            </div>
            <Stats stats={stats} element={element} scale={iconScale} /> <br />
            {priority && <>
                <PriorityButton scale={iconScale} priority={priority} setPriority={setPriority} /><br />
            </>}
        </Popup>
    );
}