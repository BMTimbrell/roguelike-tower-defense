import { useState, type JSX, type MouseEventHandler } from "react";
import styles from './Card.module.css';

export default function card({ children, popup, setPopupPos, handleClick, scale, classNames, animationDelay }: {
    children: React.ReactNode;
    animationDelay?: number;
    popup?: JSX.Element;
    setPopupPos?: React.Dispatch<React.SetStateAction<{
        x: number;
        y: number;
    } | null>>;
    handleClick: MouseEventHandler<HTMLDivElement>;
    scale: number;
    classNames?: string[];
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <>
            <div className={styles["card-wrap"]}>
                <div
                    onClick={handleClick}
                    onMouseEnter={e => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        setPopupPos && setPopupPos({
                            x: rect.x,
                            y: rect.y - 35 * scale
                        });
                        setHovered(true);
                    }}
                    onMouseLeave={() => setHovered(false)}
                    style={{ ...(animationDelay ? { animationDelay: `${animationDelay}ms` } : '' )}}
                    className={`${styles.card} ${classNames?.map(c => c) || ''}`}
                >
                    {children}
                </div>
            </div>

            {hovered && popup}
        </>
    );
}