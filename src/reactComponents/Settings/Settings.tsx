import { useEffect, useState } from "react";
import Button from "../Button/Button";
import { useAtom } from "jotai";
import { controlsAtom, gameStateAtom } from "../../store";
import styles from "./Settings.module.css";

export default function Settings({ setShowSettings }: { setShowSettings: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    type SelectedKey = {
        action: string;
        type: "keyboard" | "mouse";
    };
    const [controls] = useAtom(controlsAtom);
    const [selectedKey, setSelectedKey] = useState<null | SelectedKey>(null);
    const actions = [
        { name: "camUp", description: "Scroll up" },
        { name: "camDown", description: "Scroll down" },
        { name: "camLeft", description: "Scroll left" },
        { name: "camRight", description: "Scroll right" },
        { name: "scroll", description: "Scroll camera" },
        { name: "cancel", description: "Cancel selection" }
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
        if (selectedKey && selectedKey.type === "keyboard") {
            const key = e.key === " " ? "space" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowRight" ? "right" : e.key === "ArrowUp" ? "up" : e.key === "ArrowDown" ? "down" : e.key;
            controls.setButton(selectedKey.action, key.toLowerCase(), "keyboard");
            setSelectedKey(null);
        }
        if (selectedKey && selectedKey.type === "mouse") {
            controls.setButton(selectedKey.action, "", "mouse");
            setSelectedKey(null);
        }
    }

    const handleMouseDown = (e: MouseEvent) => {
        if (selectedKey && selectedKey.type === "mouse") {
            const button = e.button === 0 ? "left" : e.button === 1 ? "middle" : e.button === 2 ? "right" : e.button === 3 ? "back" : e.button === 4 ? "forward" : "";
            controls.setButton(selectedKey.action, button, "mouse");
            setSelectedKey(null);
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    });

    return (
        <div className={styles["settings-container"]}>
            <div className={styles.heading}>Settings</div>
            <div className={styles["button-container"]}>
                {actions.map((action, index) => (
                    <div key={index} className={styles["key-container"]}>
                        <div>{action.description}</div>
                        <div
                            className={`${styles.key} ${action.name === selectedKey?.action && selectedKey.type === "keyboard" ? styles.selected : ''}`}
                            onClick={() => setSelectedKey({ action: action.name, type: "keyboard" })}
                        >
                            {controls.getButton(action.name).keyboard ?? "-"}
                        </div>
                        <div
                            className={`${styles.key} ${action.name === selectedKey?.action && selectedKey.type === "mouse" ? styles.selected : ''}`}
                            onClick={() => setSelectedKey({ action: action.name, type: "mouse" })}
                        >
                            {controls.getButton(action.name).mouse ?? "-"}
                        </div>
                    </div>
                ))}
                <div className={styles["toggle-container"]}>
                    <label htmlFor="screenScroll">Move camera at screen edges</label>
                    <input
                        id="screenScroll"
                        type="checkbox"
                        checked={gameState.camMoveAtEdge}
                        onChange={(e) => {
                            setGameState(prev => ({
                                ...prev,
                                camMoveAtEdge: e.target.checked
                            }));
                        }}
                    />
                </div>
            </div>
            <Button onClick={() => setShowSettings(false)}>Back</Button>
        </div>
    );
}