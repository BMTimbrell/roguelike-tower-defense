import type { MouseEventHandler } from "react";
import styles from './Modal.module.css';

export default function Modal({ isOpen, children, onClose }: { children: React.ReactNode; isOpen: boolean; onClose: MouseEventHandler<HTMLDivElement> }) {
    return (
        <div
            className={`${styles["modal-overlay"]} ${isOpen ? styles.active : ""}`}
            onClick={onClose}
        >
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
                <div className={styles["modal-close"]}></div>
            </div>
        </div>
    );
}