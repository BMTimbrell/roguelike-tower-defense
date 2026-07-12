import { useAtom } from "jotai";
import { activeTutorialAtom, gameStateAtom, mapAtom } from "../../store";
import Modal from "../Modal/Modal";
import { TUTORIALS } from "../../constants";
import { useState } from "react";
import styles from './TutorialModal.module.css';
import Button from "../Button/Button";
import { playUISound } from "../../utils/soundHelpers";

export default function TutorialModal() {
    const [activeTutorial, setActiveTutorial] = useAtom(activeTutorialAtom);
    const [gameState] = useAtom(gameStateAtom);
    const tutorial = activeTutorial && TUTORIALS[activeTutorial];
    const steps = tutorial?.steps ?? [];
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;
    const [stepIndex, setStepIndex] = useState(0);

    return (
        <Modal
            isOpen={Boolean(activeTutorial)}
            onClose={() => setActiveTutorial(null)}
            disableCloseOnClick={true}
        >
            <div style={{ fontSize: `${fontScale * 16}px` }} className={styles.container}>
                <div className={styles.title}>
                    {
                        steps[stepIndex]?.title
                    }
                </div>
                <div className={styles["image-container"]}>
                    {steps[stepIndex]?.images.map((img, index) => (
                        <img key={index} src={`sprites/${img}`} />
                    ))}
                </div>
                <div className={styles.text}>
                    {
                        steps[stepIndex]?.text
                    }
                </div>

                <div className={styles.footer}>
                    {stepIndex > 0 && (
                        <Button
                            onClick={() => { 
                                setStepIndex(prev => prev - 1);
                                playUISound(gameState.context, "ui click");
                            }}
                            onMouseEnter={() => playUISound(gameState.context, "ui hover")}
                            classNames={[styles["arrow-button"]]}
                        >←</Button>
                    )}
                    {stepIndex >= steps.length - 1 ? (
                        <Button
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                                setActiveTutorial(null);
                                setStepIndex(0);
                                gameState.context?.get("*").forEach(obj => obj.paused = false);
                            }}
                            onMouseEnter={() => playUISound(gameState.context, "ui hover")}
                        >
                            Close
                        </Button>

                    ) : (
                        <Button
                            classNames={[
                                styles["arrow-button"],
                                styles["right-arrow-button"],
                            ]}
                            onMouseEnter={() => playUISound(gameState.context, "ui hover")}
                            onClick={() => {
                                playUISound(gameState.context, "ui click");
                                setStepIndex(prev => prev + 1);
                            }}
                        >
                            →
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}