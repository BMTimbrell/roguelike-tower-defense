import { useState, type JSX, type MouseEventHandler } from "react";
import styles from './Card.module.css';

export default function Card({ children, popup, setPopupPos, handleClick, scale, classNames, animationDelay, setDeckHovered }: {
    children: React.ReactNode;
    animationDelay?: number;
    popup?: JSX.Element;
    setPopupPos?: React.Dispatch<React.SetStateAction<{
        x: number;
        y: number;
    } | null>>;
    handleClick?: MouseEventHandler<HTMLDivElement>;
    scale: number;
    classNames?: string[];
    setDeckHovered?: React.Dispatch<React.SetStateAction<boolean>>;
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
                        if (setDeckHovered) setDeckHovered(true);
                    }}
                    onMouseLeave={() => {
                        setHovered(false);
                        if (setDeckHovered) setDeckHovered(false);
                    }}
                    style={{
                         ...(animationDelay ? { animationDelay: `${animationDelay}ms` } : "" ),
                         ...(handleClick ? { cursor: "pointer" } : "")
                    }}
                    className={`${styles.card} ${classNames?.join(' ') || ''}`}
                >
                    {children}
                </div>
            </div>

            {hovered && popup}
        </>
    );
}