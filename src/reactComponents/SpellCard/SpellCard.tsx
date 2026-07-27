import { useAtom } from "jotai";
import type { SpellName } from "../../types";
import styles from './SpellCard.module.css';
import { mapAtom } from "../../store";

export default function SpellCard({ name, onClick, icon, iconScale, uses }: { name?: SpellName; onClick?: () => void; icon?: string; iconScale: number; uses: number; }) {
    const [map] = useAtom(mapAtom);

    return (
        <div 
            style={uses > 0 ? { padding: "0" } : {}} 
            className={styles.container} 
            onClick={onClick}
        >
            <div style={{ fontSize: `${iconScale > 1 ? '1.2em' : '0.875em'}`}}>{name}</div>
            {icon && <img width={14 * map.iconScale * iconScale} src={icon} />}
            {uses > 0 && <div style={{ fontSize: `${iconScale > 1 ? '1.2em' : '0.875em'}`}}>{"Uses: " + uses}</div>}
        </div>
    );
}