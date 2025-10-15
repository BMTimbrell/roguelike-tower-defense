import { mapAtom } from '../../store';
import { useAtom } from 'jotai';

export default function Overlay() {
    const [map] = useAtom(mapAtom);
    const mapXPos = map.xPos;

    return (
        <>
            <div style={{ position: 'absolute', width: `${mapXPos}px`, height: "100dvh", pointerEvents: 'none', background: "black" }}>
            </div>

            <div style={{ position: 'absolute', top: 0, right: `${mapXPos}`, width: `${mapXPos}px`, height: "100dvh", pointerEvents: 'none', background: "black" }}>
            </div>
        </>
    );
}