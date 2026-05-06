import { useAtom } from "jotai";
import { gameSpeedUIAtom, mapAtom } from "../../store";
import Button from "../Button/Button";
import styles from './GameSpeedButton.module.css';

export default function GameSpeedButtons() {
    const [gameSpeedUI, setGameSpeedUI] = useAtom(gameSpeedUIAtom);
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
                    }}
                    classNames={[`${gameSpeedUI.activeIndex === index ? styles.active : ''}`]}
                >
                    <img width={button.width * scale} src={button.icon} />
                </Button>
            ))}
        </div>
    );
}