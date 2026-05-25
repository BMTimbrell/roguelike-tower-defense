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
    const scale = map.scale;
    const unlockedHeroes = heroProgression.unlocked;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
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

                                {!unlocked && <img className={styles.padlock} width={`${32 * scale}px`} src="/sprites/lock.png" />}

                                <img width={scale * 32} src={`sprites/${HEROES[id].sprite}`} />
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
                                        scale={scale}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className={styles.description}>
                                        Unlock by beating Glacier Peak on Hard.
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