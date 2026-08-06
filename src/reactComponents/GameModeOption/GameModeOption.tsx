import { useAtom } from "jotai";
import { mapAtom } from "../../store";
import styles from "./GameModeOption.module.css";

export default function GameModeOption({ onClick, onMouseEnter, heading, description, locked, unlockText }: { onClick: React.MouseEventHandler<HTMLDivElement>; onMouseEnter: React.MouseEventHandler<HTMLDivElement>; heading: string; description: string; locked: boolean; unlockText?: string; }) {
    const [map] = useAtom(mapAtom);
    const iconScale = map.iconScale;

    return (
        <div 
            onClick={(e) => {
                if (!locked) onClick(e);
            }}
            onMouseEnter={(e) => {
                if (!locked) onMouseEnter(e);
            }} className={`${styles.container} ${locked ? styles.locked : ''}`}>
            <div className={styles.heading}>{heading} {locked && <img width={`${16 * iconScale}`} src="sprites/lock.png" />}</div>
            <div className={styles.description}>{description}</div>
            {locked && unlockText && (
                <div className={styles.unlockText}>
                    {unlockText}
                </div>
            )}
        </div>
    );
}