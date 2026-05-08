import { useState } from "react";
import Modal from "../Modal/Modal";
import { mainMenuAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { useAtom } from "jotai";
import Settings from "../Settings/Settings";
import Button from "../Button/Button";
import styles from "./MainMenu.module.css";

export default function MainMenu() {
    const [showSettings, setShowSettings] = useState(false);
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
                <Button onClick={() => {
                    setSelectHeroUI(prev => ({ ...prev, visible: true }));
                    setMenu(prev => ({ ...prev, visible: false }));
                }}>New Game</Button>
                <Button onClick={() => setShowSettings(true)}>Settings</Button>
            </div>
            <Modal header={header} isOpen={showSettings} onClose={() => setShowSettings(false)}>
                <div style={{ fontSize: `${16 * scale}px` }}>
                    <Settings />
                </div>
            </Modal>
        </>
    );
}