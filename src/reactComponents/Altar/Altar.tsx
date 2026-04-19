import { useAtom } from "jotai";
import { altarAtom, mapAtom } from "../../store";
import styles from './Altar.module.css';

export default function Altar() {
    const [altar, setAltar] = useAtom(altarAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.heading}>Altar</div>
        </div>
    );
}