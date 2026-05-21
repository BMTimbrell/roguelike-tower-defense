import { useState } from "react";
import Modal from "../Modal/Modal";
import { mainMenuAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { useAtom } from "jotai";
import Settings from "../Settings/Settings";
import Button from "../Button/Button";
import styles from "./MainMenu.module.css";
import Difficulty from "../Difficulty/Difficulty";

export default function MainMenu() {
    const [showSettings, setShowSettings] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [, setSelectHeroUI] = useAtom(selectHeroUIAtom);
    const [, setMenu] = useAtom(mainMenuAtom)
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const header = showSettings && <div style={{
        fontSize: `${16 * scale * 1.2}px`, marginBottom: "0.5em",
        textAlign: "center"
    }} className={styles.heading}>Settings</div>;

    return (
        <>
            <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
                {!showDifficulty && (<>
                    <Button onClick={() => {
                        setShowDifficulty(true);
                    }}>New Game</Button>
                    <Button onClick={() => setShowSettings(true)}>Settings</Button>
                </>)}
                {showDifficulty && <Difficulty 
                    onClick={ ()=> { 
                        setSelectHeroUI(prev => ({ ...prev, visible: true }));
                        setMenu(prev => ({ ...prev, visible: false })); 
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