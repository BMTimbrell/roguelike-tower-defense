import kaplay from "kaplay";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./constants";

export default function makeKaplayCtx() {

    return kaplay({
        global: false,
        pixelDensity: 1,
        scale: 2,
        width: VIRTUAL_WIDTH,
        height: VIRTUAL_HEIGHT,
        stretch: true,
        letterbox: true,
        debug: true,
        canvas: document.querySelector<HTMLCanvasElement>("#game") ?? undefined
    });
}