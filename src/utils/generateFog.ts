import type { KAPLAYCtx } from "kaplay";
import { FOG_Z, TILE_SIZE } from "../constants";
import type { MapChunk, Tile } from "../types";
import { unblockRevealedChunkTiles } from "./generateProceduralMap";

export default function generateFog(k: KAPLAYCtx, mapWorldWidth: number, mapWorldHeight: number, chunks?: MapChunk[]) {
    const mapMask = k.add([
        k.pos(0, 0),
        k.rect(mapWorldWidth, mapWorldHeight),
        k.z(FOG_Z),
        k.mask("subtract")
    ]);

    const fogOverlay = mapMask.add([
        k.sprite("fog", { width: k.width(), height: k.height() }),
        k.opacity(0.85),
        k.z(FOG_Z),
        k.fixed()
    ]);

    k.onResize(() => {
        fogOverlay.width = k.width();
        fogOverlay.height = k.height();
    });

    if (!chunks) return;

    // Fog over unrevealed chunks
    for (const chunk of chunks) {
        if (chunk.revealed) continue;

        const pos = k.vec2(
            chunk.startX * TILE_SIZE,
            chunk.startY * TILE_SIZE
        );

        const width = chunk.width * TILE_SIZE;
        const height = chunk.height * TILE_SIZE;

        // Hide the actual terrain/path
        k.add([
            k.rect(width, height),
            k.pos(pos),
            k.color("#1a1a1a"), // same as canvas background
            k.z(-50),           // above map, below enemies
            "chunkFogBackground",
            {
                chunk
            }
        ]);

        // Atmospheric fog over everything
        k.add([
            k.sprite("fog", {
                width,
                height
            }),
            k.pos(pos),
            k.opacity(0.85),
            k.z(FOG_Z),
            "chunkFog",
            {
                chunk
            }
        ]);
    }
}

export function revealChunk(
    k: KAPLAYCtx,
    chunk: MapChunk,
    tileGrid: Tile[][]
) {
    chunk.revealed = true;

    unblockRevealedChunkTiles(
        tileGrid,
        chunk
    );

    const fogBg = k
        .get("chunkFogBackground")
        .find(fogBg => fogBg.chunk === chunk);

    if (fogBg) k.destroy(fogBg);

    const fog = k
        .get("chunkFog")
        .find(fog => fog.chunk === chunk);

    if (fog) {
        k.tween(
            fog.opacity,
            0,
            0.5,
            value => fog.opacity = value,
            k.easings.easeOutQuad
        ).then(() => {
            k.destroy(fog);
        });
    }
}