import { mapAtom } from '../../store';
import { useAtom } from 'jotai';

type props = {
    mouseEnter: () => void;
    mouseExit: () => void;
};

export default function Overlay({ mouseEnter, mouseExit }: props) {
    const [map] = useAtom(mapAtom);

    return (
        <>
            {/* Side overlays */}
            <div 
                onMouseEnter={mouseEnter}
                onMouseLeave={mouseExit}
                style={{ 
                    position: 'absolute', 
                    width: `${map.x}px`, 
                    height: "100dvh", 
                    background: "#333" 
                }}
            >
            </div>

            <div
                onMouseEnter={mouseEnter}
                onMouseLeave={mouseExit}
                style={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: `${map.x}`, 
                    width: `${map.x}px`, 
                    height: "100dvh", 
                    background: "#333" 
                }}
            >
            </div>

            {/* Top and bottom overlays */}

            <div
                onMouseEnter={mouseEnter}
                onMouseLeave={mouseExit}
                style={{ 
                    position: 'absolute',
                    top: 0,
                    width: "100%", 
                    height: `${map.y}px`, 
                    background: "#333" 
                }}
            >
            </div>

            <div
                onMouseEnter={mouseEnter}
                onMouseLeave={mouseExit}
                style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    width: "100%", 
                    height: `${map.y}px`, 
                    background: "#333" 
                }}
            >
            </div>
        </>
    );
}