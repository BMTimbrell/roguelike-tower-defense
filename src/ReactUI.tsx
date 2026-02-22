import { useAtom } from 'jotai';
import { gameStateAtom, rewardsAtom, startingOptionsAtom } from './store';
import { BottomBar } from "./reactComponents/BottomBar/BottomBar";
import SelectedTower from "./reactComponents/SelectedTower/SelectedTower";
import SelectedHero from './reactComponents/SelectedHero/SelectedHero';
import Rewards from './reactComponents/Rewards/Rewards';
import type { Scene } from './types';
import StartingOptions from './reactComponents/StartingOptions/StartingOptions';

export default function ReactUI() {
    const [gameState] = useAtom(gameStateAtom);
    const [startingOptions] = useAtom(startingOptionsAtom);
    const [rewards] = useAtom(rewardsAtom);
    const selectedUI = gameState.selectedUI;
    const selectedTower =
        selectedUI && "towerId" in selectedUI
            ? selectedUI
            : null;
    const selectedHeroUI = selectedUI && "heroId" in selectedUI
        ? selectedUI
        : null;
    const nonLevelScenes: Scene[] = ["mainMenu", "levelTransition"];

    return (
        <>
            {!nonLevelScenes.includes(gameState.scene) && <BottomBar />}

            {startingOptions.visible && <StartingOptions />}

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

            {rewards.visible && <Rewards />}
        </>
    );
}