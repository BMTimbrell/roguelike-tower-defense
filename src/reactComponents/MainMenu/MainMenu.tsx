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
import GameModes from "../GameModes/GameModes";
import GameModeOption from "../GameModeOption/GameModeOption";
import CampaignSelection from "../CampaignSelection/CampaignSelection";

export default function MainMenu() {
    type MainMenuScreen = "main" | "gameMode" | "campaign" | "difficulty" | "endless";

    const [showSettings, setShowSettings] = useState(false);
    const [gameMode, setGameMode] =
        useState<"campaign" | "endless" | null>(null);
    const [campaign, setCampaign] =
        useState<"world1" | "world2" | null>(null);
    const [screen, setScreen] = useState<MainMenuScreen>("main");
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
    };

    const handleClick = () => {
        playUISound(gameState.context, "ui click");
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

                {screen === "main" && (<>
                    <div className={styles.title}><img width={`${462 * fontScale}px`} src="sprites/librarylogo.png" /></div>

                    {save?.run && <Button
                        onClick={() => {
                            playUISound(gameState.context, "ui click");
                            const k = gameState.context;
                            const saveData = save.run;
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
                                world: saveData.world ?? 1,
                                towerCoins: saveData.towerCoins,
                                sceneIndex: saveData.sceneIndex,
                                level: saveData.level,
                                health: saveData.health,
                                maxHealth: saveData.maxHealth,
                                waveNumber: 0,
                                luck: 1,
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
                                        else {
                                            setGameState(prev => ({
                                                ...prev,
                                                selectedUpgrade: null
                                            }));
                                            k.add(hero);
                                        }
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
                            setScreen("gameMode");
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

                    {IS_DEMO && !isDesktop() && <a href="https://store.steampowered.com/app/4851710/A_Roguelike_Tower_Defense" target="_blank">
                        <Button
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                            }}
                            onMouseEnter={onHover}
                        >
                            Wishlist on Steam
                        </Button>
                    </a>}

                    {isDesktop() && IS_DEMO && (
                        <Button
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                                window.platform?.openExternal(
                                    "https://store.steampowered.com/app/4851710/A_Roguelike_Tower_Defense"
                                );
                            }}
                            onMouseEnter={onHover}
                        >
                            Wishlist on Steam
                        </Button>
                    )}

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

                {screen === "difficulty" && <Difficulty
                    onClick={() => {
                        setSelectHeroUI(prev => ({ ...prev, visible: true }));
                        setMenu(prev => ({ ...prev, visible: false }));
                        playUISound(gameState.context, "ui click");
                    }}
                    onBackClick={() => {
                        handleClick();
                        if (gameMode === "endless") setScreen("gameMode");
                        else if (gameMode === "campaign") setScreen("campaign");
                        else setScreen("main");
                    }}
                />}

                {screen === "gameMode" && (
                    <GameModes onBackClick={() => {
                        setScreen("main");
                        handleClick();
                    }}>
                        <GameModeOption 
                            onClick={() => {
                                setScreen("campaign");
                                setGameMode("campaign");
                                handleClick();
                            }}
                            locked={false}
                            onMouseEnter={onHover}
                            heading="Campaign"
                            description="Embark on a 6 level campaign and beat the final boss to win."
                        />

                        <GameModeOption
                            onClick={() => {
                                setScreen("difficulty");
                                setGameMode("endless");
                                handleClick();
                            }}
                            locked={IS_DEMO}
                            unlockText={IS_DEMO ? "Locked in demo." : undefined}
                            onMouseEnter={onHover}
                            heading="Endless"
                            description="Challenge yourself with endless waves of enemies."
                        />
                    </GameModes>
                )}

                {screen === "campaign" && (
                    <CampaignSelection
                        onClick={() => {
                            setScreen("difficulty");
                            handleClick();
                        }}
                        onBackClick={() => {
                            handleClick();
                            setScreen("gameMode");
                        }}
                    />
                )}
            </div>

            <Modal header={header} isOpen={showSettings} onClose={() => setShowSettings(false)}>
                <div style={{ fontSize: `${16 * fontScale}px` }}>
                    <Settings />
                </div>
            </Modal>
        </>
    );
}