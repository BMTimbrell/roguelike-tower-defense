import { useAtom } from "jotai";
import { ELEMENTS, SEEDS, TOWERS } from "../../constants";
import { useTowerPopup } from "../../reactHooks/useTowerPopup";
import type { SeedId } from "../../types";
import Button from "../Button/Button";
import styles from './Seed.module.css';
import { mapAtom } from "../../store";
import TowerPopup from "../TowerPopup/TowerPopup";
import DescriptionPopup from "../DescriptionPopup/DescriptionPopup";

export default function Seed({ s, plantSeed }: { s: SeedId, plantSeed: (id: SeedId) => void }) {
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const { element, name, description, stats, cost, sprite } = TOWERS[s];
    const popup = useTowerPopup(scale, !!ELEMENTS[element].description);

    return (
        <>
            <div className={styles.seed}>
                <div 
                    style={{ color: ELEMENTS[element].color }}
                    {...popup.getTriggerProps<HTMLDivElement>()}
                >
                    {SEEDS[s].name}
                </div>
                <div>
                    Turns to grow: {SEEDS[s].turnsToGrow}
                </div>

                <Button onClick={() => plantSeed(s)}>
                    Plant
                </Button>
            </div>

            {popup.showBase && (
                <TowerPopup
                    ref={popup.popupRef}
                    name={name}
                    element={element}
                    description={description}
                    stats={stats}
                    cost={0}
                    pos={popup.basePos}
                    scale={scale}
                />
            )}

            {popup.showElement && (
                <DescriptionPopup pos={popup.elementPos}>
                    {ELEMENTS[element].description}
                </DescriptionPopup>
            )}
        </>
    );
}