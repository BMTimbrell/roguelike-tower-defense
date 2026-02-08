import { useAtom } from "jotai";
import { gameStateAtom, mapAtom } from "../../store";
import type { SelectedHeroUI } from "../../types";
import Popup from "../Popup/Popup";
import PriorityButton from "../PriorityButton/PriorityButton";
import styles from "./SelectedHero.module.css";

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
        <Popup mode="world" pos={pos}>
            <div className={styles.name}>
                <div>{name}</div>
                <div className={styles.level}>Level: {level}</div>
            </div>
            <PriorityButton scale={scale} priority={priority} setPriority={setPriority} />
        </Popup>
    );
}