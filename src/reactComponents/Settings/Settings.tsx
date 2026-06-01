import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { audioAtom, controlsAtom, gameStateAtom } from "../../store";
import styles from "./Settings.module.css";
import { updateMusicVolume } from "../../utils/soundHelpers";

export default function Settings() {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [audio, setAudio] = useAtom(audioAtom);
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
        { name: "cancel", description: "Cancel selection" },
        { name: "speed1x", description: "1x speed" },
        { name: "speed2x", description: "2x speed" },
        { name: "speed3x", description: "3x speed" },
        { name: "card1", description: "Card 1" },
        { name: "card2", description: "Card 2" },
        { name: "card3", description: "Card 3" },
        { name: "card4", description: "Card 4" },
        { name: "card5", description: "Card 5" },
        { name: "card6", description: "Card 6" },
        { name: "card7", description: "Card 7" },
        { name: "card8", description: "Card 8" },
        { name: "card9", description: "Card 9" },
        { name: "card10", description: "Card 10" }
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

            <div className={styles["volume-container"]}>

                <div className={styles["slider-container"]}>
                    <label htmlFor="masterVolume">
                        Master Volume
                    </label>

                    <input
                        id="masterVolume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={audio.masterVolume}
                        onChange={(e) => {
                            setAudio(prev => ({
                                ...prev,
                                masterVolume: Number(e.target.value)
                            }));

                            updateMusicVolume();
                        }}
                    />
                </div>

                <div className={styles["slider-container"]}>
                    <label htmlFor="musicVolume">
                        Music Volume
                    </label>

                    <input
                        id="musicVolume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={audio.musicVolume}
                        onChange={(e) => {
                            setAudio(prev => ({
                                ...prev,
                                musicVolume: Number(e.target.value)
                            }));

                            updateMusicVolume();
                        }}
                    />
                </div>

                <div className={styles["slider-container"]}>
                    <label htmlFor="sfxVolume">
                        SFX Volume
                    </label>

                    <input
                        id="sfxVolume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={audio.sfxVolume}
                        onChange={(e) => {
                            setAudio(prev => ({
                                ...prev,
                                sfxVolume: Number(e.target.value),
                                uiVolume: Number(e.target.value)
                            }));
                        }}
                    />
                </div>
            </div>


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

            </div>

            <div>
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
                <div className={styles["toggle-container"]}>
                    <label htmlFor="showDamageNumbers">Show damage numbers</label>
                    <input
                        id="showDamageNumbers"
                        type="checkbox"
                        checked={gameState.showDamageNumbers}
                        onChange={(e) => {
                            setGameState(prev => ({
                                ...prev,
                                showDamageNumbers: e.target.checked
                            }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}