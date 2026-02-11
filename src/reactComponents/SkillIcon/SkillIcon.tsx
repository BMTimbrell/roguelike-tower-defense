import { useLayoutEffect, useRef, useState } from "react";
import DescriptionPopup from "../DescriptionPopup/DescriptionPopup";

export default function SkillIcon({ src, scale, description }: { src: string; scale: number; description: string }) {
    const popupRef = useRef<HTMLDivElement | null>(null);
    const iconRef = useRef<HTMLImageElement | null>(null);
    const [popup, setPopup] = useState(false);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (!popup || !popupRef.current || !iconRef.current) return;

        const iconRect = iconRef.current.getBoundingClientRect();
        const popupRect = popupRef.current.getBoundingClientRect();
        const padding = 20 * scale;

        setPopupPos({
            x: iconRect.x,
            y: iconRect.y - (popupRect.height + padding)
        });
    }, [popup, scale]);

    return (
        <>
            <img
                ref={iconRef}
                src={src}
                onMouseEnter={e => {
                    const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
                    setPopupPos({
                        x: rect.x,
                        y: rect.y
                    });
                    setPopup(true);
                }}
                onMouseLeave={() => {
                    setPopup(false);
                    setPopupPos({ x: 0, y: 0 });
                }}
                width={`${16 * scale}px`}
            />

            {popup && <DescriptionPopup pos={{ x: popupPos?.x || 0, y: popupPos?.y || 0 }}>
                <div ref={popupRef}>
                    {description}
                </div>
            </DescriptionPopup>}
        </>
    );
}