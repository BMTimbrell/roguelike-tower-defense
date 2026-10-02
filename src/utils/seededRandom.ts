export function createSeededRandom(seed: number) {
    let state = seed >>> 0;

    return () => {
        state += 0x6D2B79F5;
        let t = state;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function getChallengeSeed(runSeed: number, levelIndex: number) {
    return (runSeed + levelIndex * 0x9E3779B9 + 0x12345678) >>> 0;
}

export function getObeliskSeed(runSeed: number, levelIndex: number) {
    return (runSeed + levelIndex * 0x9E3779B9 + 0x87654321) >>> 0;
}

export function getChestSeed(
    runSeed: number,
    x: number,
    y: number
) {
    return (
        runSeed +
        x * 0x9E3779B9 +
        y * 0x85EBCA6B +
        0x2468ACE0
    ) >>> 0;
}