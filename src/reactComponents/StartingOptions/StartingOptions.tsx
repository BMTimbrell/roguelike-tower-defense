import { startingOptionsAtom, mapAtom, gameStateAtom, unlockProgressionAtom } from "../../store";
import { useAtom } from "jotai";
import styles from './StartingOptions.module.css';
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import TowerCard from "../TowerCard/TowerCard";
import { playUISound } from "../../utils/soundHelpers";
import generateTowerOptions from "../../utils/generateTowerOptions";
import generateDeck from "../../utils/generateDeck";
import type { KAPLAYCtx } from "kaplay";

export default function StartingOptions() {
    const [startingOptions, setStartingOptions] = useAtom(startingOptionsAtom);
    const addLoadout = startingOptions.addLoadout;
    const [gameState] = useAtom(gameStateAtom);
    const [unlockProgression] = useAtom(unlockProgressionAtom);
    const completedCampaigns = unlockProgression.completedCampaigns;
    const rerollsUnlocked = [1, 2].every(world =>
        completedCampaigns.some(
            campaign => campaign.world === world && campaign.difficulty === "hard"
        )
    );
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;
    const iconScale = map.iconScale;
    const options = startingOptions.options;

    const rerollOption = (index: number) => {
        if (!gameState.context) return;

        setStartingOptions(prev => ({
            ...prev,
            options: prev.options.map((option, i) =>
                i === index
                    ? { ids: generateTowerOptions(), upgrades: generateDeck(gameState.context as KAPLAYCtx) }
                    : option
            )
        }));
    };

    return (
        <div className={styles.container} style={{ fontSize: `${16 * fontScale}px` }}>
            <div className={styles.heading}>Pick a Loadout</div>

            <div className={styles.options}>
                {options.map((o, index) => (
                    <div
                        onClick={() => addLoadout(o.ids, o.upgrades)}
                        onMouseEnter={() => playUISound(gameState.context, "ui pop")}
                        className={styles.option}
                        key={index}
                    >
                        {rerollsUnlocked && <div onClick={e => {
                            e.stopPropagation();
                            rerollOption(index);
                        }} className={styles.reroll}><img width={`${15 * iconScale}`} src="sprites/dice.png" /></div>}

                        <div className={styles.towers}>
                            {o.ids.map((i, index) => (
                                <TowerCard key={index} id={i} scale={fontScale} />
                            ))}
                        </div>

                        <div className={styles.upgrades}>
                            {o.upgrades.map((u, index) => (
                                <UpgradeCard key={index} upgrade={u} scale={fontScale} showPopup={true} popupOffset={{ x: 0, y: 25 }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}