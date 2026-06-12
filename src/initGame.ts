import makeKaplayCtx from './kaplayCtx';
import level1 from './scenes/level1';
import loadAssets from './loadAssets';
import levelTransition from './scenes/levelTransition';
import type { Scene } from './types';
import mainMenu from './scenes/mainMenu';
import level1_2 from './scenes/level1-2';
import level2 from './scenes/level2';
import level2_2 from './scenes/level2-2';
import level3 from './scenes/level3';
import level4 from './scenes/level4';
import level4_2 from './scenes/level4-2';
import level5 from './scenes/level5';
import level5_2 from './scenes/level5-2';
import level6 from './scenes/level6';
import { audioAtom, controlsAtom, gameStateAtom, store } from './store';
import type { MouseButton } from 'kaplay';

export default function initGame() {
    // focus back on canvas when clicking on html elements
    window.addEventListener("click", () => document.querySelector<HTMLCanvasElement>('#game')?.focus());

    const k = makeKaplayCtx();

    level1(k);

    level1_2(k);

    level2(k);

    level2_2(k);

    level3(k);

    level4(k);

    level4_2(k);

    level5(k);

    level5_2(k);

    level6(k);

    mainMenu(k);

    levelTransition(k);

    loadAssets(k);

    k.loadFont("free pixel", "fonts/FreePixel.ttf");

    k.setBackground(k.Color.fromHex("#131313"));

    k.go("mainMenu" satisfies Scene);

    const saveData = localStorage.getItem("saveData");

    if (!saveData) {
        // default settings
        localStorage.setItem("saveData", JSON.stringify({
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
            camMoveAtEdge: true,
            showDamageNumbers: true
        }));
    } else if (saveData && JSON.parse(saveData)?.buttons) {
        const buttons = JSON.parse(saveData).buttons;

        for (const action in buttons) {
            if (buttons[action].mouse) {
                k.setButton(
                    action,
                    { mouse: buttons[action].mouse ? buttons[action].mouse : undefined }
                );
            }

            if (buttons[action].keyboard) {
                k.setButton(
                    action,
                    { keyboard: buttons[action].keyboard }
                );
            }
        }
    }

    if (saveData && JSON.parse(saveData)?.volumes) {
        const volumes = JSON.parse(saveData).volumes;
        const { masterVolume, sfxVolume, musicVolume, uiVolume } = volumes;

        store.set(audioAtom, prev => ({
            ...prev,
            masterVolume,
            sfxVolume,
            musicVolume,
            uiVolume
        }));
    }

    store.set(controlsAtom, prev => ({
        ...prev,
        getButton: (action) => k.getButton(action as "cancel" | "scroll" | "camLeft" | "camRight" | "camUp" | "camDown" | "pause"),
        setButton: (action, key, type) => {
            k.setButton(
                action,
                type === "mouse"
                    ? { mouse: key ? key as MouseButton : undefined }
                    : { keyboard: key }
            );
        }
    }));

    store.set(gameStateAtom, prev => ({
        ...prev,
        context: k
    }));
}