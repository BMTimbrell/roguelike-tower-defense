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

    return (
        <>
            <div className={styles.container} style={{ fontSize: `${16 * map.scale}px` }}>
                <Button onClick={() => {
                    setSelectHeroUI(prev => ({ ...prev, visible: true }));
                    setMenu(prev => ({ ...prev, visible: false }));
                }}>New Game</Button>
                <Button onClick={() => setShowSettings(true)}>Settings</Button>
            </div>
            <Modal isOpen={showSettings} onClose={() => setShowSettings(false)}>
                <div style={{ fontSize: `${16 * map.scale}px` }}>
                    <Settings setShowSettings={setShowSettings} />
                </div>
            </Modal>
        </>
    );
}