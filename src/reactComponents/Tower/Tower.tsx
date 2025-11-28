import styles from './Tower.module.css';
import { type MouseEventHandler } from 'react';

export default function Tower(
    {
        name,
        scale,
        onClick
    }: {
         name: string | undefined,
         scale: number,
         onClick: MouseEventHandler<HTMLDivElement> | undefined
    }
) {
    return (
        <div 
            style={{
                fontSize: `calc(16px * ${scale})`
            }}
            className={styles.tower}
            onClick={onClick}
        >
            {name}
        </div>
    );
}