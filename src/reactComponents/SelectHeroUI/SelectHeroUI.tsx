import { useAtom } from "jotai";
import { gameStateAtom, unlockProgressionAtom, mapAtom, selectHeroUIAtom } from "../../store";
import { HEROES, IS_DEMO, type HeroId } from "../../constants";
import styles from './SelectHeroUI.module.css';
import Stats from "../Stats/Stats";
import { useState } from "react";
import { playUISound } from "../../utils/soundHelpers";
import { getUnlockDescription } from "../../utils/checkUnlocks";

export default function SelectHeroUI() {
    const [gameState] = useAtom(gameStateAtom);
    const [selectHeroUI] = useAtom(selectHeroUIAtom);
    const [map] = useAtom(mapAtom);
    const [unlockProgression] = useAtom(unlockProgressionAtom);
    const [showDetails, setShowDetails] = useState<HeroId | null>(null);
    const [unlockDescription, setUnlockDescription] = useState<string | null>(null);
    const fontScale = map.fontScale;
    const iconScale = map.iconScale;
    const unlockedHeroes = unlockProgression.unlockedHeroes;

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
                                    if (!unlocked) {
                                        const description = IS_DEMO && id !== "wizard"  ? "Locked in demo" : getUnlockDescription(id as Exclude<HeroId, "archer" | "songstress" | "necromancer">, unlockProgression);
                                        setUnlockDescription(description);
                                    }
                                    playUISound(gameState.context, "ui pop");
                                }}
                            >
                                <div>
                                    {HEROES[id].name}
                                </div>

                                {!unlocked && <img className={styles.padlock} width={`${32 * iconScale}px`} src="sprites/lock.png" />}

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
                                        {unlockDescription}
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