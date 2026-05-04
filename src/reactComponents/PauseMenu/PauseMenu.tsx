import { useAtom } from "jotai";
import Button from "../Button/Button";
import { gameStateAtom, mapAtom, pauseMenuAtom } from "../../store";
import Modal from "../Modal/Modal";
import styles from "./PauseMenu.module.css";
import { useState } from "react";
import Settings from "../Settings/Settings";

export default function PauseMenu() {
    const [pauseMenu, setPauseMenu] = useAtom(pauseMenuAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [showSettings, setShowSettings] = useState(false);
    const [gameState, setGameState] = useAtom(gameStateAtom);

    const onClose = () => {
        setPauseMenu(prev => ({ ...prev, visible: false }));
        setShowSettings(false);
        pauseMenu.unPause();
    };

    return (
        <Modal isOpen={pauseMenu.visible} onClose={onClose}>
            <div style={{ fontSize: `${16 * scale}px` }}>
                {!showSettings ? (
                    <div className={styles.container}>
                        <div className={styles.heading}>Paused</div>
                        <div className={styles["button-container"]}>
                            <Button onClick={onClose}>Resume</Button>
                            <Button onClick={() => setShowSettings(true)}>Settings</Button>
                            <Button onClick={() => {pauseMenu.mainMenu()}}>Main Menu</Button>
                        </div>
                    </div>

                ) : <Settings setShowSettings={setShowSettings} />}
            </div>
        </Modal>
    );
}