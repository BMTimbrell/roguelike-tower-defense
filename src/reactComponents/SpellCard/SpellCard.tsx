import { useAtom } from "jotai";
import type { SpellName } from "../../types";
import styles from './SpellCard.module.css';
import { mapAtom } from "../../store";

export default function SpellCard({ name, onClick, icon, iconScale }: { name?: SpellName; onClick?: () => void; icon?: string; iconScale: number; }) {
    const [map] = useAtom(mapAtom);

    return (
        <div className={styles.container} onClick={onClick}>
            <div style={{ fontSize: `${iconScale > 1 ? '1.2em' : '0.875em'}`}}>{name}</div>
            {icon && <img width={14 * map.iconScale * iconScale} src={icon} />}
        </div>
    );
}