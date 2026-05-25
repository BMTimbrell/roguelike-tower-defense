import { useAtom } from 'jotai';
import styles from './Difficulty.module.css';
import { gameStateAtom, mapAtom } from '../../store';
import { playUISound } from '../../utils/soundHelpers';

export default function Difficulty({ onClick }: { onClick: React.MouseEventHandler<HTMLDivElement> }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const hardUnlocked = true;
    const expertUnlocked = false;
    const [map] = useAtom(mapAtom);
    const scale = map.scale;

    const onMouseEnter = () => {
        playUISound(gameState.context, "ui hover");
    };

    return (
        <>
            <div className={styles.heading}>Choose a Difficulty</div>
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
                    onClick={(e) => {
                        if (!hardUnlocked) return;

                        onClick(e);

                        setGameState(prev => ({
                            ...prev,
                            difficulty: "hard"
                        }));
                    }}
                >
                    <div className={styles.heading}>Hard {!hardUnlocked && <img width={`${16 * scale}`} src="/sprites/lock.png" />}</div>
                    <div>For experienced players who already understand the game's systems. Enemies have more health, making combat more demanding and less forgiving.</div>
                    {!hardUnlocked && (
                        <div className={styles.unlockText}>
                            Unlock by beating the game on Normal.
                        </div>
                    )}
                </div>

                <div
                    className={`${styles.difficulty} ${!expertUnlocked ? styles.locked : ""}`}
                    onClick={(e) => {
                        if (!expertUnlocked) return;

                        onClick(e);

                        setGameState(prev => ({
                            ...prev,
                            difficulty: "expert"
                        }));
                    }}
                >
                    <div className={styles.heading}>Expert {!expertUnlocked && <img width={`${16 * scale}`} src="/sprites/lock.png" />}</div>
                    <div>For veteran players who have mastered the game's systems. Enemies have increased armour, and gain additional health and speed in later waves, creating a relentless late-game challenge.</div>
                    {!expertUnlocked && (
                        <div className={styles.unlockText}>
                            Unlock by beating the game on Hard.
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}