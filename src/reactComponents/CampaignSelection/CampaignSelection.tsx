import { useAtom } from "jotai";
import { playUISound } from "../../utils/soundHelpers";
import MenuHeader from "../MainMenu/MenuHeader/MenuHeader";
import styles from "./CampaignSelection.module.css";
import { gameStateAtom } from "../../store";
import GameModeOption from "../GameModeOption/GameModeOption";
import { IS_DEMO } from "../../constants";

export default function CampaignSelection({ onClick, onBackClick }: { onClick: React.MouseEventHandler<HTMLDivElement>; onBackClick: React.MouseEventHandler<HTMLButtonElement> }) {
    const [gameState, setGameState] = useAtom(gameStateAtom);
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
                        setGameState(prev => ({
                            ...prev,
                            world: 1
                        }));
                    }}
                    onMouseEnter={onMouseEnter}
                    heading="World 1"
                    description="Journey through lush forests and frozen tundras."
                    locked={false}
                />
                <GameModeOption
                    onClick={(e) => {
                        onClick(e);
                        setGameState(prev => ({
                            ...prev,
                            world: 2
                        }));
                    }}
                    onMouseEnter={onMouseEnter}
                    heading="World 2"
                    description="Brave scorching deserts and the fiery depths of Hell."
                    locked={IS_DEMO}
                    unlockText="Locked in demo."
                />
            </div>
        </>
    );
}