import { useAtom } from 'jotai';
import { gameStateAtom } from './store';
import Overlay from "./reactComponents/Overlay/Overlay";
import { BottomBar } from "./reactComponents/BottomBar/BottomBar";
import SelectedTower from "./reactComponents/SelectedTower/SelectedTower";

export default function ReactUI() {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const selectedTower = gameState.selectedTower;

    const handleMouseEnter = () => {
        setGameState(prev => ({
            ...prev,
            mouseOverUI: true
        }));
    };

    const handleMouseExit = () => {
        setGameState(prev => ({
            ...prev,
            mouseOverUI: false
        }));
    };

    return (
        <>
            <Overlay
                mouseEnter={handleMouseEnter}
                mouseExit={handleMouseExit}
            />
            <BottomBar
                mouseEnter={handleMouseEnter}
                mouseExit={handleMouseExit}
            />
            {selectedTower &&
                <SelectedTower
                    key={selectedTower.towerId}
                    tower={selectedTower}
                />
            }
        </>
    );
}