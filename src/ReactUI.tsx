import { useAtom } from 'jotai';
import { gameStateAtom } from './store';
import Overlay from "./reactComponents/Overlay/Overlay";
import { BottomBar } from "./reactComponents/BottomBar/BottomBar";
import SelectedTower from "./reactComponents/SelectedTower/SelectedTower";

export default function ReactUI() {
    const [gameState] = useAtom(gameStateAtom);
    const selectedTower = gameState.selectedTower;

    return (
        <>
            <Overlay />
            <BottomBar />
            {selectedTower && 
                <SelectedTower
                    name={selectedTower.name}
                    range={selectedTower.range}
                    fireInterval={selectedTower.fireInterval}
                    cost={selectedTower.cost}
                    pos={selectedTower.pos}
                    upgrades={selectedTower.upgrades}
                    unlockedUpgradeSlots={selectedTower.unlockedUpgradeSlots}
                    addUpgradeSlot={selectedTower.addUpgradeSlot}
                    upgradeCost={selectedTower.upgradeCost}
                />
            }
        </>
    );
}