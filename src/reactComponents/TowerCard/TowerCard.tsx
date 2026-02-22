import { ELEMENTS, TOWERS, type TowerId } from "../../constants";
import { useTowerPopup } from "../../reactHooks/useTowerPopup";
import DescriptionPopup from "../DescriptionPopup/DescriptionPopup";
import styles from './TowerCard.module.css';
import TowerPopup from "../TowerPopup/TowerPopup";

export default function TowerCard({ id, scale }: { id: TowerId; scale: number; }) {
    const { element, name, description, stats, cost } = TOWERS[id];
    const popup = useTowerPopup(scale, !!ELEMENTS[element].description);

    return (
        <>
            <div
                {...popup.getTriggerProps<HTMLDivElement>()}
            >
                {name}
            </div>

            {popup.showBase && (
                <TowerPopup
                    ref={popup.popupRef}
                    name={name}
                    element={element}
                    description={description}
                    stats={stats}
                    cost={cost}
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