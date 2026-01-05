import styles from "./SelectedTower.module.css";
import { mapAtom } from '../../store';
import { useAtom } from 'jotai';
import type { SelectedTower } from '../../types';
import UpgradeSlot from "../UpgradeSlot/UpgradeSlot";
import { MAX_TOWER_UPGRADES } from '../../constants';
import CostText from "../CostText/CostText";

export default function SelectedTower({
    name, 
    range, 
    fireInterval, 
    cost, 
    pos, 
    upgrades, 
    unlockedUpgradeSlots,
    upgradeCost,
    addUpgradeSlot
}: SelectedTower) {
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const onClick = addUpgradeSlot;

    return (
        <div 
            className={styles.container}
            style={{
                '--x': `calc(${map.x}px + ${pos.x} * ${map.scale}px)`,
                '--y': `calc(${map.y}px + ${pos.y} * ${map.scale}px)`,
                fontSize: `calc(16px * ${scale})`
            } as React.CSSProperties}
        >
            <div className={styles.name}>{name}</div>
            <div className={styles.stats}>
                <div>Fire rate: {fireInterval}</div>
                <div>Range: {range}</div>
            </div>
            <div className={styles.upgrades}>
                {(Array.from({ length: MAX_TOWER_UPGRADES })).map((_, index) => (
                    <UpgradeSlot 
                        upgrade={upgrades[index]} 
                        unlocked={index < unlockedUpgradeSlots}
                        {...(index === unlockedUpgradeSlots ? { onClick } : {})}
                        key={index} 
                    >
                        
                        {index === unlockedUpgradeSlots && <CostText cost={upgradeCost} />}
                    </UpgradeSlot>
                ))}
                {/* {unlockedUpgradeSlots < MAX_TOWER_UPGRADES && <AddUpgradeButton onClick={addUpgradeSlot} cost={upgradeCost} />} */}
            </div>
        </div>
    );
}