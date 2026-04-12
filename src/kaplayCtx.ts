import kaplay from "kaplay";

export default function makeKaplayCtx() {
    return kaplay({
        global: false,
        // scale: 2,
        // width: VIRTUAL_WIDTH,
        // height: VIRTUAL_HEIGHT,
        // stretch: true,
        // letterbox: true,
        debug: true,
        canvas: document.querySelector<HTMLCanvasElement>("#game") ?? undefined
    });
}