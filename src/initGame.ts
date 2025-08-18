import makeKaplayCtx from './kaplayCtx';

export default function initGame() {
    // focus back on canvas when clicking on html elements
    window.addEventListener("click", () => document.querySelector<HTMLCanvasElement>('game')?.focus());

    const k = makeKaplayCtx();

    k.setBackground(k.Color.fromHex("#131313"));


}