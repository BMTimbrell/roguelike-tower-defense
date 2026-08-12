import type { TargetPriority } from "../../types";
import styles from "./PriorityButton.module.css";
import Button from "../Button/Button";
import { useState } from "react";
import { useAtom } from "jotai";
import { gameStateAtom } from "../../store";

export default function PriorityButton({
    scale,
    priority,
    setPriority
}: {
    scale: number;
    priority: TargetPriority;
    setPriority: (priority: TargetPriority) => void;
}) {
    const [gameState] = useAtom(gameStateAtom);
    const cactusPriority: TargetPriority[] = gameState.context?.get("cactus").length ? ["Cactus"] : [];
    const priorities: TargetPriority[] = ["Most Progress", "Least Progress", "Highest HP", "Lowest HP", "Closest", "Furthest", ...cactusPriority];
    let priorityIndex = priorities.findIndex(p => p === priority);
    const [hovered, setHovered] = useState(false);

    const handleRightClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e.button === 2) {
            setPriority(priorities[priorityIndex > 0 ? priorityIndex - 1 : priorities.length - 1]);
        }
    };

    return (
        <Button
            style={{ marginBottom: "0.5em", position: "relative" }}
            onClick={() => setPriority(priorities[priorityIndex < priorities.length - 1 ? priorityIndex + 1 : 0])}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseDown={handleRightClick}
        >
            <div className={styles.progress}>
                <img style={{ width: `${16 * scale}px`, marginRight: '0.125em' }} src="sprites/target2.png" />
                <div>{priority}</div>
            </div>

            {hovered && (
                <div className={styles["icon-container"]}>
                    <div className={styles.icon}>
                        <img width="32" src="sprites/right-click-icon.png" />
                        <div>
                            Previous
                        </div>
                    </div>

                    <div className={styles.icon}>
                        <img width="32" src="sprites/left-click-icon.png" />
                        <div>
                            Next
                        </div>
                    </div>
                </div>
            )}
        </Button>
    );
}