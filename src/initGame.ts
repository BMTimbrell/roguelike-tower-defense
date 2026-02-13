import makeKaplayCtx from './kaplayCtx';
import level1 from './scenes/level1';
import loadAssets from './loadAssets';
import levelTransition from './scenes/levelTransition';

export default function initGame() {
    // focus back on canvas when clicking on html elements
    window.addEventListener("click", () => document.querySelector<HTMLCanvasElement>('#game')?.focus());

    const k = makeKaplayCtx();

    level1(k);

    levelTransition(k);

    loadAssets(k);

    k.loadFont("free pixel", "fonts/FreePixel.ttf");

    k.setBackground(k.Color.fromHex("#131313"));

    k.go("level1");
}