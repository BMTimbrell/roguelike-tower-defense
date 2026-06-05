import type { TargetPriority } from "../../types";
import styles from "./PriorityButton.module.css";
import Button from "../Button/Button";

export default function PriorityButton({
    scale,
    priority,
    setPriority
}: {
    scale: number;
    priority: TargetPriority;
    setPriority: (priority: TargetPriority) => void;
}) {

    const priorities: TargetPriority[] = ["Most Progress", "Least Progress", "Highest HP", "Lowest HP", "Closest", "Furthest"];
    let priorityIndex = priorities.findIndex(p => p === priority);

    const handleRightClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e.button === 2) {
            setPriority(priorities[priorityIndex > 0 ? priorityIndex - 1 : priorities.length - 1]);
        }
    };

    return (
        <Button
            style={{ marginBottom: "0.5em" }}
            onClick={() => setPriority(priorities[priorityIndex < priorities.length - 1 ? priorityIndex + 1 : 0])}
            onMouseDown={handleRightClick}
        >
            <div className={styles.progress}>
                <img style={{ width: `${16 * scale}px`, marginRight: '0.125em' }} src="sprites/target2.png" />
                <div>{priority}</div>
            </div>
        </Button>
    );
}