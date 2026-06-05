import type { MouseEventHandler } from "react";
import styles from './Button.module.css';

export default function Button({ style, onClick, onMouseEnter, onMouseDown, disabled, children, classNames }: {
    style?: React.CSSProperties; 
    onClick?: MouseEventHandler<HTMLButtonElement>; 
    onMouseDown?: MouseEventHandler<HTMLButtonElement>; 
    onMouseEnter?: MouseEventHandler<HTMLButtonElement>; 
    children?: React.ReactNode;
    disabled?: boolean;
    classNames?: string[];
}) {
    return (
        <button onMouseEnter={onMouseEnter} onMouseDown={onMouseDown} disabled={disabled} className={`${styles.button} ${classNames?.map(c => c)}`} style={style} onClick={onClick}>
            {children}
        </button>
    );
}