import { useAtom } from "jotai";
import Button from "../Button/Button";
import { mapAtom, pauseMenuAtom } from "../../store";
import Modal from "../Modal/Modal";
import styles from "./PauseMenu.module.css";
import { useState } from "react";
import Settings from "../Settings/Settings";

export default function PauseMenu() {
    const [pauseMenu, setPauseMenu] = useAtom(pauseMenuAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [showSettings, setShowSettings] = useState(false);
    const footer = showSettings && <div style={{ fontSize: `${16 * scale}px` }}>
        <Button onClick={() => setShowSettings(false)}>Back</Button>
    </div>;
    const header = showSettings && <div style={{ fontSize: `${16 * scale * 1.2}px` }} className={styles.heading}>Settings</div>;

    const onClose = () => {
        setPauseMenu(prev => ({ ...prev, visible: false }));
        setShowSettings(false);
        pauseMenu.unPause();
    };

    return (
        <Modal header={header} footer={footer} isOpen={pauseMenu.visible} onClose={onClose}>
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

                ) : <Settings />}
            </div>
        </Modal>
    );
}