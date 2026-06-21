import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import { gameStateAtom, mainMenuAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { useAtom } from "jotai";
import Settings from "../Settings/Settings";
import Button from "../Button/Button";
import styles from "./MainMenu.module.css";
import Difficulty from "../Difficulty/Difficulty";
import { playUISound } from "../../utils/soundHelpers";
import goToNextScene from "../../utils/goToNextScene";
import { getSave } from "../../platform/save";
import type { SaveData } from "../../types";
import { isDesktop } from "../../platform/platform";
import { IS_DEMO } from "../../constants";
import updateSkills from "../../utils/updateSkills";
import { ChallengeManager } from "../../utils/challengeHelpers";
import makeHero from "../../entities/Hero";
import addTowers from "../../utils/addTowers";

export default function MainMenu() {
    const [showSettings, setShowSettings] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [, setSelectHeroUI] = useAtom(selectHeroUIAtom);
    const [, setMenu] = useAtom(mainMenuAtom)
    const [map] = useAtom(mapAtom);
    const [save, setSave] = useState<SaveData | null>(null);
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

    useEffect(() => {
        async function load() {
            const save = await getSave();
            setSave(save);
        }

        load();
    }, []);

    return (
        <>
            <div className={styles.container} style={{ fontSize: `${16 * fontScale}px` }}>

                {!showDifficulty && (<>
                    <div className={styles.title}><img width={`${462 * fontScale}px`} src="sprites/librarylogo.png" /></div>

                    {save?.run && <Button
                        onClick={() => {
                            playUISound(gameState.context, "ui click");
                            const k = gameState.context;
                            const saveData = save.run
                            if (!saveData || !k) return;

                            let hero = makeHero(
                                k,
                                {
                                    heroId: saveData.hero.id,
                                    pos: k.toWorld(k.mousePos()),
                                    tileGrid: saveData.tileGrid,
                                    pathTiles: saveData.pathTiles,
                                    level: saveData.hero.level
                                }
                            );

                            hero.skillIds = saveData.hero.skills;

                            updateSkills(hero);

                            setMenu(prev => ({ ...prev, visible: false }));
                            setGameState(prev => ({
                                ...prev,
                                timeScale: 1,
                                towerCoins: saveData.towerCoins,
                                sceneIndex: saveData.sceneIndex,
                                level: saveData.level,
                                health: saveData.health,
                                maxHealth: saveData.maxHealth,
                                waveNumber: 0,
                                shops: saveData.shops,
                                waveActive: false,
                                heroCharge: saveData.heroCharge,
                                deck: {
                                    drawCard: () => { },
                                    drawCost: 10,
                                    cards: saveData.deck
                                },
                                selectedUpgrade: null,
                                difficulty: saveData.difficulty,
                                challengeManager: new ChallengeManager(),
                                nextTowerId: saveData.nextTowerId,
                                towerButtons: addTowers(k, saveData.towerButtons, saveData.tileGrid, saveData.pathTiles),
                                hero,
                                heroButton: {
                                    ...prev.heroButton,
                                    onClick: () => {
                                        if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                                        else k.add(hero);
                                    }
                                }
                            }));

                            goToNextScene(k, {
                                sceneName: saveData.scene,
                                mapData: saveData.mapData,
                                tileGrid: saveData.tileGrid,
                                pathTiles: saveData.pathTiles,
                                wave: saveData.wave
                            });

                        }}
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
                    {IS_DEMO && <a href="https://store.steampowered.com/app/4851710/A_Roguelike_Tower_Defense" target="_blank">
                        <Button
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                            }}
                            onMouseEnter={onHover}
                        >
                            Wishlist on Steam
                        </Button>
                    </a>}
                    {isDesktop() &&
                        <Button
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                                window.platform?.quitGame();
                            }}
                            onMouseEnter={onHover}
                        >
                            Quit
                        </Button>
                    }
                </>)}
                {showDifficulty && <Difficulty
                    onClick={() => {
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