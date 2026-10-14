import { useAtom } from "jotai";
import MenuHeader from "../MainMenu/MenuHeader/MenuHeader";
import { endlessMapTypeAtom, gameStateAtom } from "../../store";
import { playUISound } from "../../utils/soundHelpers";
import GameModeOption from "../GameModeOption/GameModeOption";
import { IS_DEMO } from "../../constants";
import styles from './EndlessModeSelection.module.css';

export default function EndlessModeSelection({ onClick, onBackClick }: { onClick: React.MouseEventHandler<HTMLDivElement>; onBackClick: React.MouseEventHandler<HTMLButtonElement> }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [, setEndlessMapType] = useAtom(endlessMapTypeAtom);
    const onMouseEnter = () => {
        playUISound(gameState.context, "ui hover");
    };

    return (
        <>
            <MenuHeader heading={"Endless Map Selection"} onMouseEnter={onMouseEnter} onBackClick={onBackClick} />
            <div className={styles.container}>
                <GameModeOption
                    onClick={(e) => {
                        onClick(e);
                        setGameState(prev => ({ ...prev, difficulty: "normal" }));
                        setEndlessMapType("endlessForest");
                    }}
                    onMouseEnter={onMouseEnter}
                    heading="Misty Forest"
                    description="Survive for endless waves on a map with trees."
                    locked={IS_DEMO}
                />
                <GameModeOption
                    onClick={(e) => {
                        onClick(e);
                        setGameState(prev => ({ ...prev, difficulty: "normal" }));
                        setEndlessMapType("endlessHell");
                    }}
                    onMouseEnter={onMouseEnter}
                    heading="Hell"
                    description="Survive for endless waves on a map with totems and obelisks."
                    locked={IS_DEMO}
                    unlockText="Locked in demo."
                />
            </div>
        </>
    );
}