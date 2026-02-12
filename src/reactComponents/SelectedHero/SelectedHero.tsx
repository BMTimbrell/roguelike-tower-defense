import { useAtom } from "jotai";
import { gameStateAtom, mapAtom } from "../../store";
import type { SelectedHeroUI } from "../../types";
import Popup from "../Popup/Popup";
import PriorityButton from "../PriorityButton/PriorityButton";
import styles from "./SelectedHero.module.css";
import Stats from "../Stats/Stats";
import SkillIcon from "../SkillIcon/SkillIcon";
import Button from "../Button/Button";
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
        setPriority,
        reposition
    } = hero;

    const [gameState] = useAtom(gameStateAtom);
    const canReposition = gameState.heroCanReposition;
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const skills = [...new Set(SKILLS.filter(s => skillIds.includes(s.id)))];

    return (
        <Popup mode="world" pos={pos}>
            <div className={styles.name}>
                <div>{name}</div>
                <div className={styles.level}>Level {level}</div>
            </div>
            <div className={styles.skills}> Skills:
                {skills.map((s, index) => (
                    <SkillIcon key={index} src={s.icon} scale={scale} description={s.description} />
                ))}
            </div>
            <Stats stats={stats} element={element} scale={scale} /> <br />
            <PriorityButton scale={scale} priority={priority} setPriority={setPriority} />
            {canReposition && <>
                <br /><Button onClick={reposition}>
                    Move
                </Button>
            </>}
        </Popup>
    );
}