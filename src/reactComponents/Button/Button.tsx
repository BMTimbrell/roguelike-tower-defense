import type { MouseEventHandler } from "react";
import styles from './Button.module.css';

export default function Button({ style, onClick, onMouseEnter, onMouseLeave, onMouseDown, disabled, children, classNames }: {
    style?: React.CSSProperties; 
    onClick?: MouseEventHandler<HTMLButtonElement>; 
    onMouseDown?: MouseEventHandler<HTMLButtonElement>; 
    onMouseEnter?: MouseEventHandler<HTMLButtonElement>; 
    onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
    children?: React.ReactNode;
    disabled?: boolean;
    classNames?: string[];
}) {
    return (
        <button 
            onMouseEnter={onMouseEnter} 
            onMouseDown={onMouseDown} 
            onMouseLeave={onMouseLeave} 
            disabled={disabled} 
            className={[styles.button, ...(classNames ?? [])].join(" ")} 
            style={style} 
            onClick={onClick}
        >
            {children}
        </button>
    );
}