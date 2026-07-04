import { useAtom } from "jotai";
import type { SelectedFarmTowerUI } from "../../types";
import { mapAtom } from "../../store";
import Popup from "../Popup/Popup";
import Button from "../Button/Button";
import styles from './SelectedFarm.module.css';
import calcSellPrice from "../../utils/calcSellPrice";
import { ELEMENTS, SEEDS, TOWERS } from "../../constants";
import Seed from "../Seed/Seed";

export default function SelectedFarm({ farm }: { farm: SelectedFarmTowerUI }) {
    const {
        cost,
        name,
        pos,
        sellTower,
        plantedSeed,
        turnsRemaining,
        availableSeeds,
        plantSeed
    } = farm;

    const [map] = useAtom(mapAtom);
    const scale = map.iconScale;

    return (
        <Popup mode="world" pos={pos}>
            <div className={styles.name}>{name}</div>

            <div className={styles.seeds}>
                {!plantedSeed ? availableSeeds.map(s => (
                    <Seed
                        key={s}
                        s={s}
                        plantSeed={plantSeed}
                    />
                )) : (
                    <div className={styles["growing-info"]}>
                        <div>
                            Growing: <span style={{ color: ELEMENTS[TOWERS[SEEDS[plantedSeed].growsInto].element].color }}>{SEEDS[plantedSeed].name}</span>
                        </div>

                        <div>
                            Remaining Turns: {turnsRemaining}
                        </div>
                    </div>
                )}
            </div>

            <Button onClick={sellTower}>
                Sell <img style={{ width: `${8 * scale}px`, marginRight: '0.125em' }} src="sprites/coin.png" />{calcSellPrice(cost, 0)}
            </Button>
        </Popup>
    );
}