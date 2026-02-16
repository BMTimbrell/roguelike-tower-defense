import type { MouseEventHandler } from "react";
import Button from "../Button/Button";
import { mapAtom } from "../../store";
import { useAtom } from "jotai";
import styles from './HeroButton.module.css';

export default function HeroButton({ sprite, onClick, charge }: { 
    sprite: string; 
    onClick: MouseEventHandler<HTMLButtonElement>;
    charge: number;
}) {
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const isReady = charge >= 1;
    return (
        <>
            <Button
                onClick={onClick}
                classNames={[styles.button]}
                style={{
                    fontSize: `calc(16px * ${scale})`,
                    '--charge-percent': `${Math.min(charge, 1) * 100}%`,
                    opacity: isReady ? 1 : 0.5
                } as React.CSSProperties}
                disabled={!isReady}
            >
                <img width={`${32 * scale}px`} src={sprite} />
            </Button>
        </>
    );
}