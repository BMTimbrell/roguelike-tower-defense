import { useState } from "react";
import Modal from "../Modal/Modal";
import { gameStateAtom, mainMenuAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { useAtom } from "jotai";
import Settings from "../Settings/Settings";
import Button from "../Button/Button";
import styles from "./MainMenu.module.css";
import Difficulty from "../Difficulty/Difficulty";
import { playUISound } from "../../utils/soundHelpers";
import goToNextScene from "../../utils/goToNextScene";

export default function MainMenu() {
    const [showSettings, setShowSettings] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [, setSelectHeroUI] = useAtom(selectHeroUIAtom);
    const [, setMenu] = useAtom(mainMenuAtom)
    const [map] = useAtom(mapAtom);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const fontScale = map.fontScale;
    const header = showSettings && <div style={{
        fontSize: `${16 * fontScale * 1.2}px`, marginBottom: "0.5em",
        textAlign: "center"
    }} className={styles.heading}>Settings</div>;

    const onHover = () => {
        playUISound(gameState.context, "ui hover");
    }

    const handleBackClick = () => {
        playUISound(gameState.context, "ui click");
        setShowDifficulty(false);
    };

    return (
        <>
            <div className={styles.container} style={{ fontSize: `${16 * fontScale}px` }}>

                {!showDifficulty && (<>
                    <div className={styles.title}><img width={`${462 * fontScale}px`} src="sprites/librarylogo.png" /></div>

                    {localStorage.getItem("saveData") && JSON.parse(localStorage.getItem("saveData") as string)?.towerButtons && <Button 
                        onClick={() => {
                            playUISound(gameState.context, "ui click");
                            const k = gameState.context;
                            const saveData = localStorage.getItem("saveData");
                            if (!saveData || !k) return;

                            const jsonData = JSON.parse(saveData);
                            if (!jsonData) return;
                            
                            setMenu(prev => ({ ...prev, visible: false }));
                            setGameState(prev => ({
                                ...prev,
                                scene: jsonData.scene
                            }));
                            
                            goToNextScene(k, {
                                sceneName: jsonData.scene,
                                mapData: jsonData.mapData,
                                tileGrid: jsonData.tileGrid,
                                pathTiles: jsonData.pathTiles,
                                wave: jsonData.wave,
                                level: jsonData.level
                            });
                            
                        }}
                        disabled={!localStorage.getItem("saveData")}
                        onMouseEnter={onHover}
                    >
                        Continue Game
                    </Button>}

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
                    <a href="https://store.steampowered.com/app/4851710/A_Roguelike_Tower_Defense" target="_blank">
                        <Button 
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                            }}
                            onMouseEnter={onHover}
                        >
                            Wishlist
                        </Button>
                    </a>
                </>)}
                {showDifficulty && <Difficulty 
                    onClick={ ()=> { 
                        setSelectHeroUI(prev => ({ ...prev, visible: true }));
                        setMenu(prev => ({ ...prev, visible: false })); 
                        playUISound(gameState.context, "ui click");
                    }}
                    onBackClick={handleBackClick} 
                />}
            </div>

            <Modal header={header} isOpen={showSettings} onClose={() => setShowSettings(false)}>
                <div style={{ fontSize: `${16 * fontScale}px` }}>
                    <Settings />
                </div>
            </Modal>
        </>
    );
}