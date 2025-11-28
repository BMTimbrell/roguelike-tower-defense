import type { KAPLAYCtx, Vec2, GameObj } from 'kaplay';

export default function makeTower(k: KAPLAYCtx, pos: Vec2): GameObj {
    const tower = k.add([
        k.rect(32, 32),
        k.pos(pos),
        k.color(255, 255, 255),
        {
            placed: false,
            placeable: false
        }
    ]);

    const snapEvent = k.onCollide("tile", "cursor", tile => {
        tower.color = k.Color.fromHex(tile.blocked ? "#FF0000" : "#FFFFFF");

        tower.pos = tile.pos
        tower.placeable = !tile.blocked;
    });

    tower.onMouseDown("right", () => {
        if (!tower.placed) k.destroy(tower);
    });

    tower.onMouseDown("left", () => {
        if (!tower.placed && tower.placeable) {
            tower.placed = true;
            snapEvent.cancel();
        }
    });

    tower.onUpdate(() => {

    });

    return tower;
}