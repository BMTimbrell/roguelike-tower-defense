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

        let baseX = triggerRect.x;
        const baseY = triggerRect.y - popupRect.height - padding;

        // Estimate width of element popup
        const elementWidth = 300;

        const totalWidth =
            popupRect.width +
            padding +
            elementWidth;

        // Shift both popups left if they would overflow
        if (baseX + totalWidth > window.innerWidth) {
            baseX =
                window.innerWidth -
                totalWidth -
                padding;
        }

        if (baseX < padding) {
            baseX = padding;
        }

        setBasePos({
            x: baseX,
            y: baseY,
        });

        setElementPos({
            x: baseX + popupRect.width + padding,
            y: baseY,
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