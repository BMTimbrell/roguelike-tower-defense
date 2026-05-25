import type { AudioPlay, KAPLAYCtx } from "kaplay";
import { audioAtom, store } from "../store";

export function playUISound(
    k: KAPLAYCtx | null,
    sound: string,
    volume = 2
) {
    const audioState = store.get(audioAtom);

    if (audioState.muted || !k) return;

    if (sound === "ui pop") volume *= 0.4;

    k.play(sound, {
        volume:
            volume *
            audioState.masterVolume *
            audioState.uiVolume
    });
}

export function playSfx(
    k: KAPLAYCtx,
    sound: string,
    volume = 1
) {
    const audioState = store.get(audioAtom);

    if (audioState.muted) return;

    k.play(sound, {
        volume:
            volume *
            audioState.masterVolume *
            audioState.sfxVolume,
        speed: k.rand(0.95, 1.05)
    });
}

let currentMusic: null | AudioPlay = null;

export async function playMusic(
    k: KAPLAYCtx,
    sound: string,
    volume = 1
): Promise<AudioPlay | null> {
    const audioState = store.get(audioAtom);

    if (audioState.muted) return null;

    if (currentMusic) {
        const oldMusic = currentMusic;
        currentMusic = null;

        await fadeOutMusic(k, oldMusic);
    }

    currentMusic = k.play(sound, {
        volume:
            volume *
            audioState.masterVolume *
            audioState.musicVolume,
        loop: true
    });

    return currentMusic;
}

export async function fadeOutMusic(k: KAPLAYCtx, music: AudioPlay) {
    const t = k.time();
    while (music.volume > 0 || t < 0.75) {
        music.volume -= 0.03;
        await sleep(50);
    }

    music.stop();
}

export function getMusic() {
    return currentMusic;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}