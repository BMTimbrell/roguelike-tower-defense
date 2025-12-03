import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';
import { TILE_SIZE, TOWER_RANGE_TOLERANCE } from '../constants';

export default function makeTower(k: KAPLAYCtx, pos: Vec2): GameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const tower = k.add([
        k.rect(32, 32),
        k.pos(pos),
        k.color(255, 255, 255),
        k.area({
            shape: new k.Rect(k.vec2(0), 32, 32)
        }),
        k.opacity(0.5),
        {
            placed: false,
            placeable: false,
            range: 3,
            selected: true,
            hovered: false
        },
        "tower"
    ]);

    const rangeCircle = k.add([
        k.pos(tower.pos.add(TILE_SIZE / 2, TILE_SIZE / 2)),
        k.circle(tower.range * TILE_SIZE),
        k.color(255, 255, 255),
        k.opacity(0.2)
    ]);

    rangeCircle.onUpdate(() => {
        rangeCircle.hidden = !tower.selected;
    });

    const snapEvent = k.onCollide("tile", "cursor", tile => {
        tower.color = k.Color.fromHex(tile.blocked ? "#FF0000" : "#FFFFFF");

        tower.pos = tile.pos
        rangeCircle.pos = tower.pos.add(TILE_SIZE / 2, TILE_SIZE / 2);
        tower.placeable = !tile.blocked;
    });

    tower.onCollide("cursor", () => {
        tower.hovered = true
    });

    tower.onCollideEnd("cursor", () => {
        tower.hovered = false
    });

    tower.onDestroy(() => {
        snapEvent.cancel();
        k.destroy(rangeCircle);
    });

    tower.onMouseDown("right", () => {
        if (!tower.placed) {
            k.destroy(tower);
        }
    });

    tower.onMouseDown("left", () => {
        if (!tower.placed && tower.placeable) {
            tower.placed = true;
            tower.selected = false;
            tower.opacity = 1;
            snapEvent.cancel();
        }
    });

    tower.onUpdate(() => {
        if (tower.placed) {
            k.get("enemy").forEach(enemy => {
                if (enemy.pos.sub(0, enemy.height / 2).dist(rangeCircle.pos) <= tower.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
                    k.debug.log("fire");
                }
            });
        }
    });

    return tower;
}

export function toggleTowerSelection(k: KAPLAYCtx) {
    
    k.onMousePress("left", () => {
        const hoveredTower = k.get("tower").find(tower => tower.hovered);
        
        if (hoveredTower?.selected) {
            hoveredTower.selected = false;
        } else {
            k.get("tower").forEach(tower => tower.selected = false);
            if (hoveredTower) hoveredTower.selected = true;
        }
    });
}