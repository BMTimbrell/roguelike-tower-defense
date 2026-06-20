import type { Key, MouseButton } from "kaplay";
import type { HeroId, LevelId, SkillId, TowerId } from "../constants";
import type { MapData, MetaSave, PathTile, RunSave, SaveData, Scene, SettingsSave, Tile, Upgrade } from "../types";
import { isDesktop } from "./platform";

export async function getSave(): Promise<SaveData | null> {
    let raw: string | null;

    if (isDesktop()) {
        raw = await window.platform?.loadGame() ?? null;
    } else {
        raw = localStorage.getItem("saveData");
    }
    if (!raw) return null;

    try {
        const data: unknown = JSON.parse(raw);

        // OLD SAVE (no version yet)
        if (
            typeof data === "object" &&
            data !== null &&
            !("version" in data)
        ) {
            return migrateV0ToV1(data as LegacySaveData);
        }

        if (isSaveData(data)) return data;
        return null;
    } catch {
        return null;
    }
}

async function writeSave(data: SaveData) {
    const json = JSON.stringify(data);

    if (isDesktop()) {
        await window.platform?.saveGame(json);
    } else {
        localStorage.setItem("saveData", json);
    }
}

export async function saveRun(
    run: RunSave | undefined
) {
    const save: SaveData = await getSave() ?? createDefaultSave();

    save.run = run;

    await writeSave(save);
}

function createDefaultSave() {
    return {
        version: 1,
        settings: {
            ...DEFAULT_SETTINGS,
            ...(isDesktop() ? { fullscreen: true } : {})
        },
        meta: {
            unlockedHeroes: ["archer", "wizard"] satisfies HeroId[]
        }
    };
}

export async function saveSettings(
    settings: SettingsSave
) {
    const save = await getSave() ?? createDefaultSave();

    save.settings = settings;

    await writeSave(save);
}

export async function saveMeta(
    meta: MetaSave
) {
    const save = await getSave() ?? createDefaultSave();

    save.meta = meta;

    await writeSave(save);
}

function migrateV0ToV1(old: LegacySaveData): SaveData {
    return {
        version: 1,
        settings: {
            buttons: old.buttons,
            volumes: old.volumes,
            camMoveAtEdge: old.camMoveAtEdge ?? true,
            showDamageNumbers: old.showDamageNumbers ?? true
        },
        ...(old.towerButtons ? {
            run: {
                scene: old.scene,
                sceneIndex: old.sceneIndex,
                level: old.level,
                wave: old.wave,
                health: old.health,
                maxHealth: old.maxHealth,
                towerCoins: old.towerCoins,
                deck: old.deck,
                hero: old.hero,
                heroCharge: old.heroCharge,
                shops: old.shops,
                difficulty: old.difficulty,
                nextTowerId: old.nextTowerId,
                mapData: old.mapData,
                tileGrid: old.tileGrid,
                pathTiles: old.pathTiles,
                towerButtons: old.towerButtons ?? [],
            }
        } : {}),
        meta: {
            unlockedHeroes: ["archer", "wizard"]
        }
    };
}

type LegacySaveData = {
    volumes: {
        masterVolume: number,
        sfxVolume: number,
        musicVolume: number,
        uiVolume: number
    },
    camMoveAtEdge: boolean;
    showDamageNumbers: boolean;
    buttons: Record<string, { mouse?: MouseButton, keyboard?: Key }>;
    deck: Upgrade[];
    scene: Scene;
    towerCoins: number;
    hero: {
        id: HeroId;
        level: number;
        skills: SkillId[];
    };
    sceneIndex: number;
    level: number;
    health: number;
    maxHealth: number;
    shops: ("shop" | "altar")[];
    heroCharge: {
        damageDealt: number;
        charge: number;
        damageRequired: number;
    };
    difficulty: "normal" | "hard" | "expert";
    nextTowerId: number;
    towerButtons: TowerId[];
    mapData: MapData;
    tileGrid: Tile[][];
    wave: LevelId;
    pathTiles: PathTile[];
};

function isSaveData(data: unknown): data is SaveData {
    return (
        typeof data === "object" &&
        data !== null &&
        "version" in data &&
        "settings" in data &&
        "meta" in data
    );
}

export const DEFAULT_SETTINGS = {
    buttons: {
        cancel: {
            mouse: "right" as MouseButton
        },
        scroll: {
            mouse: "middle" as MouseButton
        },
        camLeft: {
            keyboard: "a" as Key
        },
        camRight: {
            keyboard: "d" as Key
        },
        camUp: {
            keyboard: "w" as Key
        },
        camDown: {
            keyboard: "s" as Key
        },
        pause: {
            keyboard: "escape" as Key
        },
        speed1x: {
            keyboard: "z" as Key
        },
        speed2x: {
            keyboard: "x" as Key
        },
        speed3x: {
            keyboard: "c" as Key
        },
        card1: {
            keyboard: "1" as Key
        },
        card2: {
            keyboard: "2" as Key
        },
        card3: {
            keyboard: "3" as Key
        },
        card4: {
            keyboard: "4" as Key
        },
        card5: {
            keyboard: "5" as Key
        },
        card6: {
            keyboard: "6" as Key
        },
        card7: {
            keyboard: "7" as Key
        },
        card8: {
            keyboard: "8" as Key
        },
        card9: {
            keyboard: "9" as Key
        },
        card10: {
            keyboard: "10" as Key
        }
    },
    camMoveAtEdge: true,
    showDamageNumbers: true,
    volumes: {
        masterVolume: 1,
        sfxVolume: 1,
        musicVolume: 1,
        uiVolume: 1,
        muted: false
    }
};