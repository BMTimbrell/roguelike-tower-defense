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

    const mapWorldX = (VIRTUAL_WIDTH - mapData.width * mapData.tilewidth) / 2

    const screenX = offsetX + mapWorldX * scale;
    const mapScreenWidth = mapData.width * mapData.tilewidth * scale;

    return { x: screenX, width: mapScreenWidth };
}