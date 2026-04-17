import { useAtom } from "jotai";
import { mapAtom, shopChoiceUIAtom } from "../../store";
import styles from './ShopChoiceUI.module.css';
import Button from "../Button/Button";

export default function ShopChoiceUI() {
    const [shopChoiceUI] = useAtom(shopChoiceUIAtom);
    const buttons = shopChoiceUI.buttons;

    const [map] = useAtom(mapAtom);
    const scale = map.scale;

    return (
        <div style={{ fontSize: `${16 * scale}px`}} className={styles.container}>
            {
                buttons.map((b, index) => (
                    <div className={styles.choice} key={index}>
                        <div className={styles.name}>{b.name}</div>
                        <div>{b.description}</div>
                        <Button onClick={b.onClick}>{b.text}</Button>
                    </div>
                ))
            }
        </div>
    );
}