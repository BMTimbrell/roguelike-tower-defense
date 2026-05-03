import { useAtom } from "jotai";
import { challengesAtom, gameStateAtom, mapAtom } from "../../store";
import styles from "./Challenges.module.css";
import { useState } from "react";

export default function Challenges() {
    const [challenges] = useAtom(challengesAtom);
    const [gameState] = useAtom(gameStateAtom);
    const [challengeActive, setChallengeActive] = useState(false);
    const challengeManager = gameState.challengeManager;
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const active = challengeManager?.getChallenge();

    return (
        <>
            {!challengeActive && <div style={{ fontSize: `${16 * scale}px` }} className={styles.container}>
                <div className={styles.heading}>Challenges</div>
                <div className={styles["challenges-container"]}>
                    {challenges.challenges.map(challenge => (
                        <div
                            key={challenge.id}
                            onClick={() => {
                                challengeManager?.setChallenge(challenge);
                                setChallengeActive(true);
                            }}
                        >
                            <div>{challenge.description}</div>
                            <div className={styles.reward}>Reward: {challenge.reward}<img width={`${17 * scale}px`} src="/sprites/tower-coin.png" /></div>
                        </div>
                    ))}
                </div>
            </div>}

            {challengeActive && active && (
                <div style={{ fontSize: `${16 * scale}px` }} className={styles["active-challenge"]}>
                    <div>
                        {active.def.type === "progress"
                            ? `${active.def.description} (${Math.floor(active.progress)} / ${active.def.target})`
                            : active.def.description
                        }
                    </div>

                    {active.failed && <div>❌ Failed</div>}
                    {active.completed && <div>✅ Completed</div>}
                </div>
            )}

        </>
    );
}