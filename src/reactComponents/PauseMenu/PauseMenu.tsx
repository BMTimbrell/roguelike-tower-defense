import { useAtom } from "jotai";
import Button from "../Button/Button";
import { controlsAtom, gameStateAtom, mapAtom, pauseMenuAtom } from "../../store";
import Modal from "../Modal/Modal";
import styles from "./PauseMenu.module.css";
import { useEffect, useState } from "react";

export default function PauseMenu() {
    type SelectedKey = {
        action: string;
        type: "keyboard" | "mouse";
    }
    const [pauseMenu, setPauseMenu] = useAtom(pauseMenuAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [showSettings, setShowSettings] = useState(false);
    const [gameState, setGameState] = useAtom(gameStateAtom);
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

    const onClose = () => {
        setPauseMenu(prev => ({ ...prev, visible: false }));
        setShowSettings(false);
        pauseMenu.unPause();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (selectedKey && selectedKey.type === "keyboard") {
            const key = e.key === " " ? "space" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowRight" ? "right" : e.key === "ArrowUp" ? "up" : e.key === "ArrowDown" ? "down" : e.key;
            controls.setButton(selectedKey.action, key, "keyboard");
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
        <Modal isOpen={pauseMenu.visible} onClose={onClose}>
            <div style={{ fontSize: `${16 * scale}px` }}>
                {!showSettings ? (
                    <div className={styles.container}>
                        <div className={styles.heading}>Paused</div>
                        <div className={styles["button-container"]}>
                            <Button onClick={onClose}>Resume</Button>
                            <Button onClick={() => setShowSettings(true)}>Settings</Button>
                        </div>
                    </div>

                ) : <div className={styles["settings-container"]}>
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
                </div>}
            </div>
        </Modal>
    );
}