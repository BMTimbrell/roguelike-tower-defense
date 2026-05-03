import type { GameObj, KAPLAYCtx } from "kaplay"
import type { Footprint, Tile } from "../types";
import onAction from "./onAction";

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
    function isFootprintBlocked(gridX: number, gridY: number) {
        const { w = 1, h = 1 } = opts.obj.footprint ?? {};

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const tile = opts.tileGrid[gridY + y]?.[gridX + x];
                if (!tile || tile.blocked) return true;
            }
        }
        return false;
    }

    function updatePreview() {
        const mousePos = k.toWorld(k.mousePos());
        const gridX = Math.floor(mousePos.x / opts.tileSize);
        const gridY = Math.floor(mousePos.y / opts.tileSize);

        const blocked = isFootprintBlocked(gridX, gridY);

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

            setBlockedTiles({
                footprint: opts.obj.footprint,
                gridX,
                gridY,
                tileGrid: opts.obj.tileGrid,
                blocked: true
            });

            opts.obj.use(k.color("#ffffff"));
            opts.obj.selected = false;
            opts.obj.opacity = 1;
            if (opts.heroSprite) opts.heroSprite.opacity = 1;

            opts.onConfirm();
        }
    });

    onAction(k, "cancel", {
        onPress: () => {
            if (!opts.obj.placed && opts.canCancel()) {
                opts.onCancel?.();
                k.destroy(opts.obj);
                if (opts.heroSprite) k.destroy(opts.heroSprite);
            }
        }
    });
}

export function setBlockedTiles(opts: {
    footprint: Footprint;
    tileGrid: Tile[][];
    gridY: number;
    gridX: number;
    blocked: boolean;
}) {
    const { w, h } = opts.footprint;
    const { tileGrid, gridY, gridX, blocked } = opts;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            tileGrid[gridY + y][gridX + x].blocked = blocked;
        }
    }
}