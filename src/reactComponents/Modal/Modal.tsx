import type { MouseEventHandler } from "react";
import styles from './Modal.module.css';

export default function Modal({
    isOpen,
    children,
    onClose,
    footer,
    header,
    disableCloseOnClick
}: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: MouseEventHandler<HTMLDivElement>;
    footer?: React.ReactNode;
    header?: React.ReactNode;
    disableCloseOnClick?: boolean;
}) {
    return (
        <div
            className={`${styles["modal-overlay"]} ${isOpen ? styles.active : ""}`}
            onClick={!disableCloseOnClick ? onClose : () => {}}
        >
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {header && <div className={styles["modal-header"]}>
                    {header}
                </div>}
                <div className={styles["modal-main"]}>
                    {isOpen && children}
                </div>
                {footer && <div className={styles["modal-footer"]}>
                    {footer}
                </div>}
            </div>
        </div>
    );
}