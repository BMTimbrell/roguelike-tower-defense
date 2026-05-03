import kaplay from "kaplay";

export default function makeKaplayCtx() {
    return kaplay({
        global: false,
        // scale: 2,
        // width: VIRTUAL_WIDTH,
        // height: VIRTUAL_HEIGHT,
        // stretch: true,
        // letterbox: true,
        buttons: {
            cancel: {
                mouse: "middle"
            },
            scroll: {
                mouse: "right"
            },
            camLeft: {
                keyboard: "a"
            },
            camRight: {
                keyboard: "d"
            },
            camUp: {
                keyboard: "w"
            },
            camDown: {
                keyboard: "s"
            },
            pause: {
                keyboard: "escape"
            }
        },
        debug: true,
        canvas: document.querySelector<HTMLCanvasElement>("#game") ?? undefined
    });
}