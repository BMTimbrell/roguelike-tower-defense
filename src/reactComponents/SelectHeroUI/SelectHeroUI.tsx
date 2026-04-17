import { useAtom } from "jotai";
import { mapAtom, selectHeroUIAtom } from "../../store";
import { HEROES, type HeroId } from "../../constants";
import styles from './SelectHeroUI.module.css';
import Stats from "../Stats/Stats";
import { useState } from "react";

export default function SelectHeroUI() {
    const [selectHeroUI] = useAtom(selectHeroUIAtom);
    const [map] = useAtom(mapAtom);
    const [showDetails, setShowDetails] = useState<HeroId | null>(null);
    const scale = map.scale;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.heading}>Pick a Hero</div>

            <div className={styles["hero-container"]}>

                <div className={styles.options}>
                    {selectHeroUI.options.map(id => (
                        <div
                            key={id}
                            className={styles.option}
                            onClick={() => selectHeroUI.addHero(id)}
                            onMouseEnter={() => setShowDetails(id)}
                        >
                            <div>
                                {HEROES[id].name}
                            </div>

                            <img width={scale * 32} src={`sprites/${HEROES[id].sprite}`} />

                        </div>
                    ))}
                </div>

                {/* INFO PANEL */}
                <div className={styles.panel}>
                    {showDetails ? (
                        <>
                            <div className={styles.panelTitle}>
                                {HEROES[showDetails].name}
                            </div>

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
                        <div className={styles.placeholder}>
                            Hover a hero to see details
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}