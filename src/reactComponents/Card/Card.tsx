import { useState, type JSX, type MouseEventHandler } from "react";
import styles from './Card.module.css';
import { gameStateAtom } from "../../store";
import { useAtom } from "jotai";
import { playUISound } from "../../utils/soundHelpers";

export default function Card({ children, popup, setPopupPos, handleClick, handleRightClick, scale, classNames, animationDelay, setDeckHovered }: {
    children: React.ReactNode;
    animationDelay?: number;
    popup?: JSX.Element;
    setPopupPos?: React.Dispatch<React.SetStateAction<{
        x: number;
        y: number;
    } | null>>;
    handleClick?: MouseEventHandler<HTMLDivElement>;
    handleRightClick?: MouseEventHandler<HTMLDivElement>;
    scale: number;
    classNames?: string[];
    setDeckHovered?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [hovered, setHovered] = useState(false);
    const [gameState] = useAtom(gameStateAtom);

    return (
        <>
            <div className={styles["card-wrap"]}>
                <div
                    onClick={handleClick}
                    onMouseDown={handleRightClick}
                    onMouseEnter={e => {
                        playUISound(gameState.context, "ui pop");
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