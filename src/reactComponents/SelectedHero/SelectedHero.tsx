import { useAtom } from "jotai";
import { gameStateAtom, mapAtom } from "../../store";
import type { SelectedHeroUI } from "../../types";
import Popup from "../Popup/Popup";
import PriorityButton from "../PriorityButton/PriorityButton";
import styles from "./SelectedHero.module.css";
import Stats from "../Stats/Stats";
import SkillIcon from "../SkillIcon/SkillIcon";

export default function SelectedHero({ hero }: { hero: SelectedHeroUI }) {
    const {
        name,
        priority,
        stats,
        pos,
        element,
        level,
        skills,
        setPriority
    } = hero;

    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;

    return (
        <>
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
            </Popup>
        </>
    );
}