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
import { DEFAULT_SETTINGS, getSave, saveSettings } from './platform/save';
import desert1 from './scenes/desert1';
import desert2 from './scenes/desert2';

export default async function initGame() {
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

    desert1(k);

    desert2(k);

    mainMenu(k);

    levelTransition(k);

    loadAssets(k);

    k.loadFont("free pixel", "fonts/FreePixel.ttf");

    k.setBackground(k.Color.fromHex("#131313"));

    k.go("mainMenu" satisfies Scene);

    const saveData = await getSave();

    if (saveData) {
        const buttons = saveData.settings.buttons;

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
    } else await saveSettings(DEFAULT_SETTINGS);

    if (saveData) {
        const volumes = saveData.settings.volumes;
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