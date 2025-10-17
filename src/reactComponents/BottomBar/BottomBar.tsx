import { mapAtom } from '../../store';
import { useAtom } from 'jotai';

export function BottomBar() {
    const [map] = useAtom(mapAtom);

    return (
        <div style={{ 
            position: 'absolute',
            left: `${map.x}px`,
            bottom: `${map.y}px`, 
            width: `${map.width}px`, 
            height: `calc(2 * 32 * ${map.scale}px)`, 
            pointerEvents: 'none', 
            background: "gray" 
        }}>
        </div>
    );
}