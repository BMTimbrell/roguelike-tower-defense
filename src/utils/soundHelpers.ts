import type { AudioPlay, KAPLAYCtx, Vec2 } from "kaplay";
import { audioAtom, store } from "../store";

const SOUND_VOLUMES: Record<string, number> = {
    "ui pop": 0.4,
    "equip": 4,
    "snow biome": 1,
    "fireball": 0.5,
    "arrow": 0.5,
    "gunshot": 1.5,
    "level up": 0.5,
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
    "santa death": 8,
    "penguin death": 2,
    "polar bear death": 1.5,
    "wolf death": 0.4,
    "monster death": 2,
    "monster death3": 0.6,
    "dizzy": 4,
    "fairy death2": 6,
    "open chest": 0.5,
    "main title": 1.2,
    "holy": 0.75,
    "boss drums": 0.5,
    "rock smash": 2,
    "monster death4": 10,
    "totem magic": 2
};

export function playUISound(
    k: KAPLAYCtx | null,
    sound: string,
    volume = 1
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
    volume = 1,
    position?: Vec2
) {
    const audioState = store.get(audioAtom);

    if (audioState.muted) return;

    let distanceMultiplier = 1;

    if (position) {
        const camPos = k.getCamPos();

        const viewportWidth = k.width() / k.getCamScale().x;
        const viewportHeight = k.height() / k.getCamScale().x;

        const dx = Math.abs(position.x - camPos.x);
        const dy = Math.abs(position.y - camPos.y);

        const halfWidth = viewportWidth / 2;
        const halfHeight = viewportHeight / 2;

        const isVisible =
            dx < halfWidth &&
            dy < halfHeight;

        if (!isVisible) {
            const offscreenX = Math.max(0, dx - halfWidth);
            const offscreenY = Math.max(0, dy - halfHeight);

            const offscreenDistance = Math.sqrt(
                offscreenX * offscreenX +
                offscreenY * offscreenY
            );

            const fadeDistance = 300;

            distanceMultiplier = Math.max(
                0,
                1 - offscreenDistance / fadeDistance
            );

            if (distanceMultiplier < 0.05) {
                return;
            }
        }
    }

    const soundVolume = SOUND_VOLUMES[sound] ?? 1;
    const pitchVariation = k.rand(0.95, 1.05);

    k.play(sound, {
        volume:
            volume *
            distanceMultiplier *
            soundVolume *
            pitchVariation *
            audioState.masterVolume *
            audioState.sfxVolume,
        speed: k.rand(0.95, 1.05)
    });
}

let currentMusic: null | AudioPlay = null;
let musicVolume = 1;

export async function playMusic(
    k: KAPLAYCtx,
    sound: string,
    volume = 0.7
): Promise<AudioPlay | null> {
    const audioState = store.get(audioAtom);

    if (audioState.muted) return null;

    if (currentMusic) {
        const oldMusic = currentMusic;
        currentMusic = null;

        await fadeOutMusic(oldMusic);
    }

    const soundVolume = SOUND_VOLUMES[sound] ?? 1;

    musicVolume = volume * soundVolume;

    currentMusic = k.play(sound, {
        volume:
            musicVolume *
            audioState.masterVolume *
            audioState.musicVolume,
        loop: true
    });

    return currentMusic;
}

export async function fadeOutMusic(music: AudioPlay) {
    const startVolume = music.volume;
    const duration = 750;
    const steps = 15;

    for (let i = 0; i < steps; i++) {
        const t = (i + 1) / steps;
        music.volume = startVolume * (1 - t);

        await sleep(duration / steps);
    }

    music.stop();
}

export function getMusic() {
    return currentMusic;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function updateMusicVolume() {
    const audioState = store.get(audioAtom);

    if (!currentMusic) return;

    currentMusic.volume =
        musicVolume *
        audioState.masterVolume *
        audioState.musicVolume;
}