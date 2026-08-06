import Button from "../../Button/Button";
import styles from "./MenuHeader.module.css";

export default function MenuHeader({ onBackClick, onMouseEnter, heading }: { onBackClick: React.MouseEventHandler<HTMLButtonElement>; onMouseEnter: React.MouseEventHandler<HTMLButtonElement>; heading: string }) {
    return (
        <div className={styles.header}>
            <Button onMouseEnter={onMouseEnter} onClick={onBackClick} classNames={[styles["back-button"]]}>←</Button>
            <div className={styles.heading}>{heading}</div>
        </div>
    );
}