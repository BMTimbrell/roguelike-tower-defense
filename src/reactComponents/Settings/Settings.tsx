import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { audioAtom, controlsAtom, gameStateAtom } from "../../store";
import styles from "./Settings.module.css";
import { updateMusicVolume } from "../../utils/soundHelpers";
import { getSave, saveSettings } from "../../platform/save";
import type { Key, MouseButton } from "kaplay";
import { isDesktop } from "../../platform/platform";

export default function Settings() {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [audio, setAudio] = useAtom(audioAtom);
    type SelectedKey = {
        action: string;
        type: MouseButton | Key;
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

    const handleKeyDown = async (e: KeyboardEvent) => {
        const save = await getSave();
        if (!save) return;

        if (selectedKey && selectedKey.type === "keyboard") {
            const key = e.key === " " ? "space" : e.key === "ArrowLeft" ? "left" : e.key === "ArrowRight" ? "right" : e.key === "ArrowUp" ? "up" : e.key === "ArrowDown" ? "down" : e.key;
            controls.setButton(selectedKey.action, key.toLowerCase(), "keyboard");
            setSelectedKey(null);

            await saveSettings({
                ...save.settings,
                buttons: {
                    ...save.settings.buttons,
                    [selectedKey.action]: {
                        ...save.settings.buttons[selectedKey.action],
                        keyboard: key
                    }
                }
            });

        }

        if (selectedKey && selectedKey.type === "mouse") {
            controls.setButton(selectedKey.action, "", "mouse");
            setSelectedKey(null);

            await saveSettings({
                ...save.settings,
                buttons: {
                    ...save.settings.buttons,
                    [selectedKey.action]: {
                        ...save.settings.buttons[selectedKey.action],
                        mouse: undefined
                    }
                }
            });
        }
    };

    const handleMouseDown = async (e: MouseEvent) => {
        if (selectedKey && selectedKey.type === "mouse") {
            const button = e.button === 0 ? "left" : e.button === 1 ? "middle" : e.button === 2 ? "right" : e.button === 3 ? "back" : e.button === 4 ? "forward" : "";
            controls.setButton(selectedKey.action, button, "mouse");
            setSelectedKey(null);

            const save = await getSave();
            if (!save) return;

            await saveSettings({
                ...save.settings,
                buttons: {
                    ...save.settings.buttons,
                    [selectedKey.action]: {
                        ...save.settings.buttons[selectedKey.action],
                        mouse: button || undefined
                    }
                }
            });
        }
    };

    const updateSavedVolume = async () => {
        const save = await getSave();
        if (!save) return;

        await saveSettings({
            ...save.settings,
            volumes: {
                masterVolume: audio.masterVolume,
                sfxVolume: audio.sfxVolume,
                musicVolume: audio.musicVolume,
                uiVolume: audio.uiVolume
            }
        });
    };

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    });

    const [isFullscreen, setIsFullscreen] = useState(
        isDesktop() ? false : !!document.fullscreenElement
    );

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);

    useEffect(() => {
        async function init() {
            if (isDesktop()) {
                const fs = await window.platform?.isFullscreen?.();
                setIsFullscreen(!!fs);
            }
        }

        init();
    }, []);

    const toggleFullscreen = async () => {

        if (isDesktop()) {
            const next = !isFullscreen;

            window.platform?.setFullscreen(next);
            setIsFullscreen(next);

            const save = await getSave();
            if (!save) return;

            await saveSettings({
                ...save.settings,
                fullscreen: next
            });

            return;
        }

        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error(err);
        }
    };

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
                            updateSavedVolume();
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
                            updateSavedVolume();
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
                            updateSavedVolume();
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
                        onChange={async (e) => {
                            const checked = e.target.checked;

                            setGameState(prev => ({
                                ...prev,
                                camMoveAtEdge: checked
                            }));

                            const save = await getSave();
                            if (!save) return;

                            await saveSettings({
                                ...save.settings,
                                camMoveAtEdge: checked
                            });
                        }}
                    />
                </div>

                <div className={styles["toggle-container"]}>
                    <label htmlFor="showDamageNumbers">Show damage numbers</label>
                    <input
                        id="showDamageNumbers"
                        type="checkbox"
                        checked={gameState.showDamageNumbers}
                        onChange={async (e) => {
                            const checked = e.target.checked;

                            setGameState(prev => ({
                                ...prev,
                                showDamageNumbers: checked
                            }));

                            const save = await getSave();
                            if (!save) return;

                            await saveSettings({
                                ...save.settings,
                                showDamageNumbers: checked
                            });
                        }}
                    />
                </div>

                <div className={styles["toggle-container"]}>
                    <label htmlFor="fullscreen">Fullscreen</label>
                    <input
                        id="fullscreen"
                        type="checkbox"
                        checked={isFullscreen}
                        onChange={toggleFullscreen}
                    />
                </div>
            </div>

        </div>
    );
}