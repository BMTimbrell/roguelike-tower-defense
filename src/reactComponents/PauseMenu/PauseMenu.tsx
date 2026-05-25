import { useAtom } from "jotai";
import Button from "../Button/Button";
import { gameStateAtom, mapAtom, pauseMenuAtom } from "../../store";
import Modal from "../Modal/Modal";
import styles from "./PauseMenu.module.css";
import { useState } from "react";
import Settings from "../Settings/Settings";
import { playUISound } from "../../utils/soundHelpers";

export default function PauseMenu() {
    const [pauseMenu, setPauseMenu] = useAtom(pauseMenuAtom);
    const [gameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [showSettings, setShowSettings] = useState(false);
    const header = showSettings && <div style={{ fontSize: `${16 * scale * 1.2}px` }} className={styles.heading}>Settings</div>;

    const onClose = () => {
        playUISound(gameState.context, "ui click");
        setPauseMenu(prev => ({ ...prev, visible: false }));
        setShowSettings(false);
        pauseMenu.unPause();
    };

    const onMouseEnter = () => {
        playUISound(gameState.context, "ui hover");
    };

    const footer = showSettings && <div style={{ fontSize: `${16 * scale}px` }}>
        <Button 
            onMouseEnter={onMouseEnter} 
            onClick={() => {
                playUISound(gameState.context, "ui click");
                setShowSettings(false)
            }}
        >
            Back
        </Button>
    </div>;

    return (
        <Modal header={header} footer={footer} isOpen={pauseMenu.visible} onClose={onClose}>
            <div style={{ fontSize: `${16 * scale}px` }}>
                {!showSettings ? (
                    <div className={styles.container}>
                        <div className={styles.heading}>Paused</div>
                        <div className={styles["button-container"]}>
                            <Button 
                                onMouseEnter={onMouseEnter} 
                                onClick={onClose}>
                                    Resume
                                </Button>
                            <Button 
                                onMouseEnter={onMouseEnter} 
                                onClick={() => {
                                    playUISound(gameState.context, "ui click");
                                    setShowSettings(true);
                                }}
                            >
                                Settings
                            </Button>
                            <Button 
                                onMouseEnter={onMouseEnter} 
                                onClick={() => {
                                    playUISound(gameState.context, "ui click");
                                    pauseMenu.mainMenu();
                                }}
                            >
                                Main Menu
                            </Button>
                        </div>
                    </div>

                ) : <Settings />}
            </div>
        </Modal>
    );
}