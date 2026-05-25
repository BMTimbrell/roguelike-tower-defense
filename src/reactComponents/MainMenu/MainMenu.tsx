import { useState } from "react";
import Modal from "../Modal/Modal";
import { gameStateAtom, mainMenuAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { useAtom } from "jotai";
import Settings from "../Settings/Settings";
import Button from "../Button/Button";
import styles from "./MainMenu.module.css";
import Difficulty from "../Difficulty/Difficulty";
import { playUISound } from "../../utils/soundHelpers";

export default function MainMenu() {
    const [showSettings, setShowSettings] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [, setSelectHeroUI] = useAtom(selectHeroUIAtom);
    const [, setMenu] = useAtom(mainMenuAtom)
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const scale = map.scale;
    const header = showSettings && <div style={{
        fontSize: `${16 * scale * 1.2}px`, marginBottom: "0.5em",
        textAlign: "center"
    }} className={styles.heading}>Settings</div>;

    const onHover = () => {
        playUISound(gameState.context, "ui hover");
    }

    return (
        <>
            <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
                {!showDifficulty && (<>
                    <Button 
                        onClick={() => {
                            playUISound(gameState.context, "ui click");
                            setShowDifficulty(true);
                        }}
                        onMouseEnter={onHover}
                    >
                        New Game
                    </Button>
                    <Button 
                        onClick={() => {
                            setShowSettings(true);
                            playUISound(gameState.context, "ui click");
                        }}
                        onMouseEnter={onHover}
                    >
                        Settings
                    </Button>
                </>)}
                {showDifficulty && <Difficulty 
                    onClick={ ()=> { 
                        setSelectHeroUI(prev => ({ ...prev, visible: true }));
                        setMenu(prev => ({ ...prev, visible: false })); 
                        playUISound(gameState.context, "ui click");
                    }} 
                />}
            </div>

            <Modal header={header} isOpen={showSettings} onClose={() => setShowSettings(false)}>
                <div style={{ fontSize: `${16 * scale}px` }}>
                    <Settings />
                </div>
            </Modal>
        </>
    );
}