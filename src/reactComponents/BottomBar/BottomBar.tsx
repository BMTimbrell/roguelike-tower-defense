import { mapAtom, gameStateAtom } from '../../store';
import { useAtom } from 'jotai';
import Tower from '../Tower/Tower';

export function BottomBar() {
    const [map] = useAtom(mapAtom);
    const [gameState] = useAtom(gameStateAtom);
    const towers = gameState.towers;
    const tileSize = 32;

    return (
        <div style={{ 
            position: 'absolute',
            left: `${map.x}px`,
            bottom: `${map.y}px`, 
            width: `calc(100% - ${map.x}px * 2)`, 
            height: `calc(2 * ${tileSize} * ${map.scale}px)`, 
            background: "gray",
            userSelect: "none"
        }}>
            {towers.map((tower, index) => (
                <Tower 
                    key={index} 
                    name={tower.name}
                    scale={map.scale}
                    onClick={tower.onClick}
                    cost={tower.cost}
                />
            ))}
        </div>
    );
}