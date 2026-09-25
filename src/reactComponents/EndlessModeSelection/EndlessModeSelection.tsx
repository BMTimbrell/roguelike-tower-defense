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
            <MenuHeader heading={"Campaign Selection"} onMouseEnter={onMouseEnter} onBackClick={onBackClick} />
            <div className={styles.container}>
                <GameModeOption
                    onClick={(e) => {
                        onClick(e);
                        setGameState(prev => ({ ...prev, difficulty: "normal" }));
                        setEndlessMapType("endlessForest");
                    }}
                    onMouseEnter={onMouseEnter}
                    heading="Misty Forest"
                    description="Journey through lush forests and frozen tundras."
                    locked={false}
                />
                <GameModeOption
                    onClick={(e) => {
                        onClick(e);
                        // setGameState(prev => ({
                        //     ...prev,
                        //     world: 2
                        // }));
                    }}
                    onMouseEnter={onMouseEnter}
                    heading="Hell"
                    description="Brave scorching deserts and the fiery depths of Hell."
                    locked={IS_DEMO}
                    unlockText="Locked in demo."
                />
            </div>
        </>
    );
}