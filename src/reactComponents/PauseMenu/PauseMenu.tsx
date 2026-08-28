import { useAtom } from "jotai";
import Button from "../Button/Button";
import { gameStateAtom, mapAtom, pauseMenuAtom } from "../../store";
import Modal from "../Modal/Modal";
import styles from "./PauseMenu.module.css";
import { useState } from "react";
import Settings from "../Settings/Settings";
import { playUISound } from "../../utils/soundHelpers";
import { saveMetaProgress } from "../../utils/checkUnlocks";

export default function PauseMenu() {
    const [pauseMenu, setPauseMenu] = useAtom(pauseMenuAtom);
    const [gameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.fontScale;
    const [showSettings, setShowSettings] = useState(false);
    const header = showSettings && <div style={{ fontSize: `${16 * scale * 1.2}px` }} className={styles.heading}>Settings</div>;
    const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);

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
        <>
            <Modal header={header} footer={footer} isOpen={pauseMenu.visible} onClose={onClose} disableCloseOnClick={true}>
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
                                        setShowQuitConfirmation(true);
                                    }}
                                >
                                    Save & Quit
                                </Button>
                            </div>

                        </div>

                    ) : <Settings />
                    }
                </div >
            </Modal >

            <Modal isOpen={showQuitConfirmation} onClose={() => setShowQuitConfirmation(false)} disableCloseOnClick={true}>
                <div style={{ fontSize: `${16 * scale}px` }} className={styles["quit-confirmation"]}>
                    <div>Are you sure you want to quit? You will have to start from the beginning of the level.</div>

                    <div className={styles["confirm-button-container"]}>
                        <Button onClick={async () => {
                            playUISound(gameState.context, "ui click");
                            await saveMetaProgress();
                            setShowQuitConfirmation(false);
                            pauseMenu.mainMenu();
                        }}>
                            Yes
                        </Button>
                        <Button onClick={() => {
                            playUISound(gameState.context, "ui click");
                            setShowQuitConfirmation(false);
                        }}>
                            No
                        </Button>
                    </div>

                </div>
            </Modal>
        </>
    );
}