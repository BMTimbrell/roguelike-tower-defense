import { useAtom } from "jotai";
import { gameSpeedUIAtom, gameStateAtom, mapAtom } from "../../store";
import Button from "../Button/Button";
import styles from './GameSpeedButton.module.css';
import { playUISound } from "../../utils/soundHelpers";

export default function GameSpeedButtons() {
    const [gameSpeedUI, setGameSpeedUI] = useAtom(gameSpeedUIAtom);
    const [gameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;

    return (
        <div style={{ fontSize: `${16 * scale}px` }} className={styles.container}>
            {gameSpeedUI.buttons.map((button, index) => (
                <Button
                    key={index}
                    onClick={() => {
                        button.onClick();
                        setGameSpeedUI(prev => ({
                            ...prev,
                            activeIndex: index
                        }));
                        playUISound(gameState.context, "ui click");
                    }}
                    onMouseEnter={() => playUISound(gameState.context, "ui hover")}
                    classNames={[`${gameSpeedUI.activeIndex === index ? styles.active : ''}`]}
                >
                    <img width={button.width * scale} src={button.icon} />
                </Button>
            ))}
        </div>
    );
}