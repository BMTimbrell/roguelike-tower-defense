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
import { controlsAtom, store } from './store';

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

    type MouseButton = "left" | "right" | "middle" | "back" | "forward";

    function isMouseButton(key: string): key is MouseButton {
        return ["left", "right", "middle", "back", "forward"].includes(key);
    }

    store.set(controlsAtom, prev => ({
        ...prev,
        getButton: (action) => k.getButton(action as "cancel" | "scroll" | "camLeft" | "camRight" | "camUp" | "camDown" | "pause"),
        setButton: (action, key) => {
            k.setButton(
                action,
                isMouseButton(key)
                    ? { mouse: key }
                    : { keyboard: key }
            );
            console.log(k.getButton(action as "cancel" | "scroll" | "camLeft" | "camRight" | "camUp" | "camDown" | "pause"));

        }
    }));
}