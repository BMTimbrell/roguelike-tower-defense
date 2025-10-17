import type { mapData } from "../types";
import type { KAPLAYCtx } from "kaplay";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "../constants";

export default function getMapScreenBounds(k: KAPLAYCtx, mapData: mapData) {
    const canvas = k.canvas;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const scale = Math.min(canvasWidth / VIRTUAL_WIDTH, canvasHeight / VIRTUAL_HEIGHT);

    // Center offset caused by letterboxing
    const offsetX = (canvasWidth - VIRTUAL_WIDTH * scale) / 2;
    const offsetY = (canvasHeight - VIRTUAL_HEIGHT * scale) / 2;

    const mapWorldX = (VIRTUAL_WIDTH - mapData.width * mapData.tilewidth) / 2;
    const mapWorldY = 0;

    const screenX = offsetX + mapWorldX * scale;
    const screenY = offsetY + mapWorldY * scale;
    const mapScreenWidth = mapData.width * mapData.tilewidth * scale;
    const mapScreenHeight = mapData.height * mapData.tileheight * scale;

    return { 
        x: screenX,
        y: screenY,
        width: mapScreenWidth,
        height: mapScreenHeight,
        scale
    };
}