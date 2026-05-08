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
            }
        },
        debug: true,
        canvas: document.querySelector<HTMLCanvasElement>("#game") ?? undefined
    });
}