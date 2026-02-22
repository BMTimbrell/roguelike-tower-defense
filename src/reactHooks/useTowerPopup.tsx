import { useRef, useState, useLayoutEffect } from "react";

export function useTowerPopup(scale: number, hasElementPopup: boolean) {
    const triggerRef = useRef<HTMLElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);

    const [showBase, setShowBase] = useState(false);
    const [showElement, setShowElement] = useState(false);

    const [basePos, setBasePos] = useState({ x: 0, y: 0 });
    const [elementPos, setElementPos] = useState({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (!showBase || !triggerRef.current || !popupRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const popupRect = popupRef.current.getBoundingClientRect();
        const padding = 20 * scale;

        setBasePos({
            x: triggerRect.x,
            y: triggerRect.y - popupRect.height - padding,
        });

        setElementPos({
            x: triggerRect.x + popupRect.width + padding,
            y: triggerRect.y - popupRect.height - padding,
        });
    }, [showBase, scale]);

    const getTriggerProps = <T extends HTMLElement>() => ({
        ref: (el: T | null) => {
            triggerRef.current = el;
        },
        onMouseEnter: () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            setBasePos({ x: rect.x, y: rect.y });
            setShowBase(true);
            if (hasElementPopup) setShowElement(true);
        },
        onMouseLeave: () => {
            setShowBase(false);
            setShowElement(false);
        },
    });

    return {
        getTriggerProps,
        popupRef,
        showBase,
        showElement,
        basePos,
        elementPos,
    };
}