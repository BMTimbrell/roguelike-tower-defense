import { mapAtom } from '../../store';
import { useAtom } from 'jotai';

export default function Overlay() {
    const [map] = useAtom(mapAtom);

    return (
        <>
            {/* Side overlays */}
            <div style={{ 
                position: 'absolute', 
                width: `${map.x}px`, 
                height: "100dvh", 
                pointerEvents: 'none', 
                background: "black" 
            }}>
            </div>

            <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: `${map.x}`, 
                width: `${map.x}px`, 
                height: "100dvh", 
                pointerEvents: 'none', 
                background: "black" 
            }}>
            </div>

            {/* Top and bottom overlays */}

            <div style={{ 
                position: 'absolute',
                top: 0,
                width: "100%", 
                height: `${map.y}px`, 
                pointerEvents: 'none', 
                background: "black" 
            }}>
            </div>

            <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                width: "100%", 
                height: `${map.y}px`, 
                pointerEvents: 'none', 
                background: "black" 
            }}>
            </div>
        </>
    );
}