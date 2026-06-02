import { useAtom } from "jotai";
import { gameStateAtom, heroProgressionAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { HEROES, type HeroId } from "../../constants";
import styles from './SelectHeroUI.module.css';
import Stats from "../Stats/Stats";
import { useState } from "react";
import { playUISound } from "../../utils/soundHelpers";

export default function SelectHeroUI() {
    const [gameState] = useAtom(gameStateAtom);
    const [selectHeroUI] = useAtom(selectHeroUIAtom);
    const [map] = useAtom(mapAtom);
    const [heroProgression] = useAtom(heroProgressionAtom);
    const [showDetails, setShowDetails] = useState<HeroId | null>(null);
    const fontScale = map.fontScale;
    const iconScale = map.iconScale;
    const unlockedHeroes = heroProgression.unlocked;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * fontScale}px` }}>
            <div className={styles.heading}>Pick a Hero</div>

            <div className={styles["hero-container"]}>

                <div className={styles.options}>
                    {selectHeroUI.options.map(id => {
                        const unlocked = unlockedHeroes.includes(id);

                        return (
                            <div
                                key={id}
                                className={`${styles.option} ${!unlocked ? styles.locked : ""}`}
                                onClick={() => {
                                    if (unlocked) {
                                        selectHeroUI.addHero(id);
                                    }
                                }}
                                onMouseEnter={() => {
                                    setShowDetails(id);
                                    playUISound(gameState.context, "ui pop");
                                }}
                            >
                                <div>
                                    {HEROES[id].name}
                                </div>

                                {!unlocked && <img className={styles.padlock} width={`${32 * iconScale}px`} src="/sprites/lock.png" />}

                                <img width={iconScale * 32} src={`sprites/${HEROES[id].sprite}`} />
                            </div>
                        );
                    })}
                </div>

                {/* INFO PANEL */}
                <div className={styles.panel}>
                    {showDetails ? (
                        <>
                            <div className={styles.panelTitle}>
                                {HEROES[showDetails].name}
                            </div>

                            {unlockedHeroes.includes(showDetails) ? (
                                <>
                                    <div className={styles.description}>
                                        {HEROES[showDetails].description}
                                    </div>

                                    <Stats
                                        stats={HEROES[showDetails].stats}
                                        element={HEROES[showDetails].element}
                                        scale={iconScale}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className={styles.description}>
                                        Locked in demo.
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className={styles.placeholder}>
                            Hover a hero to see details
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}