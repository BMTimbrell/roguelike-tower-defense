import type { GameObj, KAPLAYCtx } from "kaplay"
import type { Tile } from "../types";

export default function makePlaceableOnGrid(
    k: KAPLAYCtx,
    opts: {
        obj: GameObj;
        heroSprite?: GameObj;
        tileGrid: Tile[][];
        tileSize: number;
        canCancel: () => boolean;
        canConfirm: () => boolean;
        onConfirm: () => void;
        onCancel?: () => void;
    }
) {
    function updatePreview() {
        const mousePos = k.toWorld(k.mousePos());
        const gridX = Math.floor(mousePos.x / opts.tileSize);
        const gridY = Math.floor(mousePos.y / opts.tileSize);

        const blocked =
            opts.tileGrid[gridY]?.[gridX]?.blocked ?? true;

        opts.obj.pos = k.vec2(gridX * opts.tileSize, gridY * opts.tileSize);
        opts.obj.color = k.Color.fromHex(blocked || !opts.canConfirm() ? "#FF0000" : "#FFFFFF");
        if (opts.heroSprite) opts.heroSprite.color = opts.obj.color;

        return !blocked;
    }

    opts.obj.onUpdate(() => {
        if (!opts.obj.placed) updatePreview();
    });

    opts.obj.onMousePress("left", () => {
        if (!opts.obj.placed && updatePreview() && opts.canConfirm()) {
            opts.obj.placed = true;

            const gridX = Math.floor(opts.obj.pos.x / opts.tileSize);
            const gridY = Math.floor(opts.obj.pos.y / opts.tileSize);
            opts.tileGrid[gridY][gridX].blocked = true;

            opts.obj.use(k.color("#ffffff"));
            opts.obj.selected = false;
            opts.obj.opacity = 1;
            if (opts.heroSprite) opts.heroSprite.opacity = 1;

            opts.onConfirm();
        }
    });

    opts.obj.onMouseDown("right", () => {
        if (!opts.obj.placed && opts.canCancel()) {
            opts.onCancel?.();
            k.destroy(opts.obj);
        }
    });

    return {
        tryReposition() {
            if (!opts.obj.placed) return false;

            const gridX = Math.floor(opts.obj.pos.x / opts.tileSize);
            const gridY = Math.floor(opts.obj.pos.y / opts.tileSize);
            opts.tileGrid[gridY][gridX].blocked = false;

            opts.obj.placed = false;
            return true;
        },
    }
}