import { useAtom } from 'jotai';
import { gameStateAtom } from './store';
import { BottomBar } from "./reactComponents/BottomBar/BottomBar";
import SelectedTower from "./reactComponents/SelectedTower/SelectedTower";
import SelectedHero from './reactComponents/SelectedHero/SelectedHero';

export default function ReactUI() {
    const [gameState] = useAtom(gameStateAtom);
    const selectedUI = gameState.selectedUI;
    const selectedTower =
        selectedUI && "towerId" in selectedUI
            ? selectedUI
            : null;
    const selectedHeroUI = selectedUI && "heroId" in selectedUI
        ? selectedUI
        : null;

    return (
        <>
            {/* <Overlay/> */}

            {gameState.bottomBarVisible && <BottomBar />}

            {selectedTower &&
                <SelectedTower
                    key={selectedTower.towerId}
                    tower={selectedTower}
                />
            }

            {selectedHeroUI &&
                <SelectedHero
                    key={selectedHeroUI.heroId}
                    hero={selectedHeroUI}
                />
            }
        </>
    );
}