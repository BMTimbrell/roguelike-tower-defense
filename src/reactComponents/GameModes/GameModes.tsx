import { useAtom } from "jotai";
import { gameStateAtom } from "../../store";
import { playUISound } from "../../utils/soundHelpers";
import MenuHeader from "../MainMenu/MenuHeader/MenuHeader";
import styles from './GameModes.module.css';

export default function GameModes({ onBackClick, children }: { onBackClick: React.MouseEventHandler<HTMLButtonElement>; children: React.ReactNode }) {
    const [gameState] = useAtom(gameStateAtom);

    const onMouseEnter = () => {
        playUISound(gameState.context, "ui hover");
    };
    return (
        <>
            <MenuHeader onBackClick={onBackClick} onMouseEnter={onMouseEnter} heading={"Choose a Game Mode"} />

            <div className={styles.container}>
                {children}
            </div>
        </>
    );
}