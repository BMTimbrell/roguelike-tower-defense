import { useAtom } from 'jotai';
import styles from './Difficulty.module.css';
import { gameStateAtom, mapAtom, unlockProgressionAtom } from '../../store';
import { playUISound } from '../../utils/soundHelpers';
import MenuHeader from '../MainMenu/MenuHeader/MenuHeader';

export default function Difficulty({ onClick, onBackClick }: { onClick: React.MouseEventHandler<HTMLDivElement>; onBackClick: React.MouseEventHandler<HTMLButtonElement> }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [unlockProgression] = useAtom(unlockProgressionAtom);
    const hardUnlocked = unlockProgression.completedCampaigns.some(c => c.difficulty === "normal" && c.world === 1);
    const expertUnlocked = false;
    const [map] = useAtom(mapAtom);
    const scale = map.fontScale;
    const iconScale = map.iconScale;

    const onMouseEnter = () => {
        playUISound(gameState.context, "ui hover");
    };

    return (
        <div className={styles.container}> 
            <MenuHeader onBackClick={onBackClick} onMouseEnter={onMouseEnter} heading="Choose a Difficulty" />

            <div className={styles["difficulty-container"]}>
                <div
                    className={styles.difficulty}
                    onClick={(e) => {
                        onClick(e);
                        setGameState(prev => ({
                            ...prev,
                            difficulty: "normal"
                        }));
                    }}
                    onMouseEnter={onMouseEnter}
                >
                    <div className={styles.heading}>Normal</div>
                    <div>A balanced adventure designed for your first journey through the world.</div>
                </div>
                <div
                    className={`${styles.difficulty} ${!hardUnlocked ? styles.locked : ""}`}
                    onMouseEnter={onMouseEnter}
                    onClick={(e) => {
                        if (!hardUnlocked) return;

                        onClick(e);

                        setGameState(prev => ({
                            ...prev,
                            difficulty: "hard"
                        }));
                    }}
                >
                    <div className={styles.heading}>Hard {!hardUnlocked && <img width={`${16 * iconScale}`} src="sprites/lock.png" />}</div>
                    <div>For experienced players who already understand the game's systems. Enemies have more health and armour, making combat more demanding and less forgiving.</div>
                    {!hardUnlocked && (
                        <div className={styles.unlockText}>
                            Unlock by beating the game on Normal.
                        </div>
                    )}
                </div>

                <div
                    className={`${styles.difficulty} ${!expertUnlocked ? styles.locked : ""}`}
                    onMouseEnter={expertUnlocked ? onMouseEnter : undefined}
                    onClick={(e) => {
                        if (!expertUnlocked) return;

                        onClick(e);

                        setGameState(prev => ({
                            ...prev,
                            difficulty: "expert"
                        }));
                    }}
                >
                    <div className={styles.heading}>Expert {!expertUnlocked && <img width={`${16 * scale}`} src="sprites/lock.png" />}</div>
                    <div>For veteran players who have mastered the game's systems.</div>
                    {!expertUnlocked && (
                        <div className={styles.unlockText}>
                            Locked in demo.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}