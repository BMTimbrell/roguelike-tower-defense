import type { MouseEventHandler } from "react";
import styles from './Button.module.css';

export default function Button({ style, onClick, children }: {
    style?: React.CSSProperties; 
    onClick?: MouseEventHandler<HTMLButtonElement>; 
    children?: React.ReactNode
}) {
    return (
        <button className={styles.button} style={style} onClick={onClick}>
            {children}
        </button>
    );
}