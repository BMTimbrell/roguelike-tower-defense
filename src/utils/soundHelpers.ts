import type { AudioPlay, KAPLAYCtx } from "kaplay";
import { audioAtom, store } from "../store";

const SOUND_VOLUMES: Record<string, number> = {
    "ui pop": 0.4,
    "equip": 4,
    "snow biome": 0.7,
    "fireball": 0.5,
    "arrow": 0.5,
    "gunshot": 1.5,
    "level up": 0.8,
    "pew": 0.6,
    "beam": 0.5,
    "blast": 0.5,
    "squish": 3,
    "explosion": 0.5,
    "thunder": 0.8,
    "crow": 0.5,
    "cannon": 0.3,
    "archer": 3,
    "knight": 3.5,
    "wizard": 1.5,
    "witch": 0.5,
    "songstress": 0.5,
    "merchant": 2.5,
    "necromancer": 3,
    "assassin": 2.5,
    "twinkle": 2,
    "flamethrower": 0.5,
    "ice magic": 2,
    "smash": 1.5,
    "zap": 0.7,
    "soft shoot": 1.5,
    "splat": 0.5,
    "ghosts": 2,
    "santa death": 6,
    "penguin death": 2,
    "polar bear death": 2,
    "wolf death": 0.4,
    "monster death": 2,
    "monster death3": 0.6,
    "present tear": 2,
    "dizzy": 4,
    "fairy death2": 3.2
};

export function playUISound(
    k: KAPLAYCtx | null,
    sound: string,
    volume = 2
) {
    const audioState = store.get(audioAtom);

    if (audioState.muted || !k) return;

    const soundVolume = SOUND_VOLUMES[sound] ?? 1;

    k.play(sound, {
        volume:
            volume *
            soundVolume *
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

    const soundVolume = SOUND_VOLUMES[sound] ?? 1;
    const pitchVariation = k.rand(0.95, 1.05);

    k.play(sound, {
        volume:
            volume *
            soundVolume *
            pitchVariation *
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

    const soundVolume = SOUND_VOLUMES[sound] ?? 1;

    currentMusic = k.play(sound, {
        volume:
            volume *
            soundVolume *
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