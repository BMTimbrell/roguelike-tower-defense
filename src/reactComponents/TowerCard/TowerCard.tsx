import { ELEMENTS, TOWERS, type TowerId } from "../../constants";
import { useTowerPopup } from "../../reactHooks/useTowerPopup";
import DescriptionPopup from "../DescriptionPopup/DescriptionPopup";
import styles from './TowerCard.module.css';
import TowerPopup from "../TowerPopup/TowerPopup";
import { createPortal } from "react-dom";
import { useAtom } from "jotai";
import { mapAtom } from "../../store";

export default function TowerCard({ id, scale }: { id: TowerId; scale: number; }) {
    const { element, name, description, stats, cost, sprite } = TOWERS[id];
    const popup = useTowerPopup(scale, !!ELEMENTS[element].description);
    const [map] = useAtom(mapAtom);
    const iconScale = map.iconScale;

    return (
        <>
            <div
                {...popup.getTriggerProps<HTMLDivElement>()}
                className={styles.container}
            >
                <div>
                    {name}
                </div>
                <div>
                    <img width={`${iconScale * 32}px`} src={`sprites/${sprite}`} />
                </div>
                {TOWERS[id].footprint.w === 2 && <div className={styles.size}>2x2</div>}
            </div>

            {popup.showBase && createPortal(
                <TowerPopup
                    ref={popup.popupRef}
                    name={name}
                    element={element}
                    description={description}
                    stats={stats}
                    cost={cost}
                    pos={popup.basePos}
                    scale={iconScale}
                />,
                document.body
            )}

            {popup.showElement && createPortal(
                <DescriptionPopup pos={popup.elementPos}>
                    {ELEMENTS[element].description}
                </DescriptionPopup>,
                document.body
            )}

        </>
    );
}