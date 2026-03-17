import type { ElementName, TowerStats } from "../../types";
import { ELEMENTS } from "../../constants";
import styles from "./Stats.module.css";

export default function ({ stats, element, scale }: { stats: TowerStats, element: ElementName, scale: number }) {
    const { damage, range, fireInterval, critChance, critDamage } = stats;

    return (
        <div className={styles.stats}>
            <div className={styles.element}>
                Element: <span style={{ color: ELEMENTS[element].color }}>{element}</span>
            </div>
            <div>
                <img width={`${16 * scale}px`} src="sprites/damage-icon.png" />
                Damage: {damage}
            </div>
            <div>
                <img width={`${16 * scale}px`} src="sprites/firerate-icon.png" />
                Fire Rate: {fireInterval > 100 ? 0 : (1 / fireInterval).toFixed(2).replace(/\.?0+$/, "")}/sec
            </div>
            <div>
                <img width={`${16 * scale}px`} src="sprites/range-icon.png" />
                Range: {range}
            </div>
            <div>
                <img width={`${16 * scale}px`} src="sprites/critchance-icon.png" />
                Crit Chance: {critChance}%
            </div>
            <div>
                <img width={`${16 * scale}px`} src="sprites/critdamage-icon.png" />
                Crit Damage: {critDamage}%
            </div>
        </div>
    );
}