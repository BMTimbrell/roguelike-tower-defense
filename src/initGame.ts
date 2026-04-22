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

    mainMenu(k);

    levelTransition(k);

    loadAssets(k);

    k.loadFont("free pixel", "fonts/FreePixel.ttf");

    k.setBackground(k.Color.fromHex("#131313"));

    k.go("mainMenu" satisfies Scene);
}