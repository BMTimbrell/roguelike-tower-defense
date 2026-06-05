import { useAtom } from 'jotai';
import { altarAtom, challengesAtom, gameSpeedUIAtom, gameStateAtom, mainMenuAtom, rewardsAtom, selectHeroUIAtom, shopAtom, shopChoiceUIAtom, startingOptionsAtom } from './store';
import { BottomBar } from "./reactComponents/BottomBar/BottomBar";
import SelectedTower from "./reactComponents/SelectedTower/SelectedTower";
import SelectedHero from './reactComponents/SelectedHero/SelectedHero';
import Rewards from './reactComponents/Rewards/Rewards';
import type { Scene } from './types';
import StartingOptions from './reactComponents/StartingOptions/StartingOptions';
import type { JSX } from 'react';
import SelectedFarm from './reactComponents/SelectedFarm/SelectedFarm';
import SelectHeroUI from './reactComponents/SelectHeroUI/SelectHeroUI';
import ShopChoiceUI from './reactComponents/ShopChoiceUI/ShopChoiceUI';
import Shop from './reactComponents/Shop/Shop';
import Altar from './reactComponents/Altar/Altar';
import Challenges from './reactComponents/Challenges/Challenges';
import PauseMenu from './reactComponents/PauseMenu/PauseMenu';
import MainMenu from './reactComponents/MainMenu/MainMenu';
import GameSpeedButtons from './reactComponents/GameSpeedButtons/GameSpeedButtons';

export default function ReactUI() {
    const [gameState] = useAtom(gameStateAtom);
    const [startingOptions] = useAtom(startingOptionsAtom);
    const [rewards] = useAtom(rewardsAtom);
    const [selectHeroUI] = useAtom(selectHeroUIAtom);
    const selectedUI = gameState.selectedUI;
    let selectedTower: null | JSX.Element = null;

    const [shopChoiceUI] = useAtom(shopChoiceUIAtom);
    const [shop] = useAtom(shopAtom);
    const [altar] = useAtom(altarAtom);
    const [challenges] = useAtom(challengesAtom);
    const [mainMenu] = useAtom(mainMenuAtom);
    const [gameSpeedUI] = useAtom(gameSpeedUIAtom);

    if (selectedUI) {
        selectedTower = "plantedSeed" in selectedUI
            ? <SelectedFarm
                    key={selectedUI.towerId}
                    farm={selectedUI}
                />
            : "towerId" in selectedUI
                ? <SelectedTower
                    key={selectedUI.towerId}
                    tower={selectedUI}
                />
            : <SelectedHero
                    key={selectedUI.heroId}
                    hero={selectedUI}
                />;
    }

    const nonLevelScenes: Scene[] = ["mainMenu", "levelTransition"];

    return (
        <>
            {!nonLevelScenes.includes(gameState.scene) && !gameState.hideUI && <BottomBar />}

            {selectHeroUI.visible && <SelectHeroUI />}

            {startingOptions.visible && <StartingOptions />}

            {selectedTower}

            {rewards.visible && <Rewards />}

            {shopChoiceUI.visible && <ShopChoiceUI />}

            {shop.visible && <Shop />}

            {altar.visible && <Altar />}

            {challenges.visible && <Challenges />}

            <PauseMenu />

            {mainMenu.visible && <MainMenu />}

            {gameSpeedUI.visible && !gameState.hideUI && <GameSpeedButtons />}
        </>
    );
}