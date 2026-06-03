import kaplay from "kaplay";

export default function makeKaplayCtx() {
    return kaplay({
        global: false,
        buttons: {
            cancel: {
                mouse: "right"
            },
            scroll: {
                mouse: "middle"
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
            },
            speed1x: {
                keyboard: "z"
            },
            speed2x: {
                keyboard: "x"
            },
            speed3x: {
                keyboard: "c"
            },
            card1: {
                keyboard: "1"
            },
            card2: {
                keyboard: "2"
            },
            card3: {
                keyboard: "3"
            },
            card4: {
                keyboard: "4"
            },
            card5: {
                keyboard: "5"
            },
            card6: {
                keyboard: "6"
            },
            card7: {
                keyboard: "7"
            },
            card8: {
                keyboard: "8"
            },
            card9: {
                keyboard: "9"
            },
            card10: {
                keyboard: "10"
            },
            zoomIn: {
                keyboard: "e"
            },
            zoomOut: {
                keyboard: "q"
            }
        },
        debug: false,
        canvas: document.querySelector<HTMLCanvasElement>("#game") ?? undefined
    });
}