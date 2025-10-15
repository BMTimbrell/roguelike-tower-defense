import makeKaplayCtx from './kaplayCtx';
import level1 from './scenes/level1';
import loadAssets from './loadAssets';

export default function initGame() {
    // focus back on canvas when clicking on html elements
    window.addEventListener("click", () => document.querySelector<HTMLCanvasElement>('game')?.focus());

    const k = makeKaplayCtx();

    level1(k);

    loadAssets(k);

    k.setBackground(k.Color.fromHex("#131313"));

    k.go("level1");
}