import { useAtom } from "jotai";
import { gameSpeedUIAtom } from "../../store";
import Button from "../Button/Button";
import styles from './GameSpeedButton.module.css';

export default function GameSpeedButtons() {
    const [gameSpeedUI] = useAtom(gameSpeedUIAtom);

    return (
        <div className={styles.container}>
            {gameSpeedUI.buttons.map((button, index) => (
                <Button key={index} onClick={button.onClick}>{button.name}</Button>
            ))}
        </div>
    );
}