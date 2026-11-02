import { HERO_UNLOCKS, HEROES, IS_DEMO, type HeroId } from "../constants";
import { getSave, saveMeta } from "../platform/save";
import { gameStateAtom, store, unlockProgressionAtom, unlockToastAtom } from "../store";
import type { MetaProgress, Requirement } from "../types";

export async function checkUnlocks(progress: MetaProgress) {
    for (const [hero, requirement] of Object.entries(HERO_UNLOCKS)) {
        if (
            !progress.unlockedHeroes.includes(hero as HeroId) &&
            meetsRequirement(progress, requirement)
        ) {
            await unlockHero(hero as HeroId);
        }
    }
}

function meetsRequirement(progress: MetaProgress, requirement: Requirement) {
    switch (requirement.type) {
        case "spells_cast":
            return progress.spellsCast >= requirement.amount;

        case "complete_level_no_loss":
            return progress.levelsWithoutLivesLost >= requirement.amount;

        case "boss_kills":
            return progress.bossesKilled >= requirement.amount;

        case "chests_opened":
            return progress.chestsOpened >= requirement.amount;

        case "poison_enemies":
            return progress.enemiesPoisoned >= requirement.amount;

        case "complete_hard":
            const completedCampaigns = store.get(unlockProgressionAtom).completedCampaigns;

            return [1, 2].every(world =>
                completedCampaigns.some(
                    campaign => campaign.world === world && campaign.difficulty === "hard"
                )
            );

        case "endless_level":
            return store.get(gameStateAtom).gameMode === "endless" && store.get(gameStateAtom).waveNumber >= requirement.amount;

        default:
            return false;
    }
}

async function unlockHero(hero: HeroId) {
    if (IS_DEMO && hero !== "wizard") return;

    const save = await getSave();
    if (!save?.meta) return;

    save.meta.unlockedHeroes.push(hero);
    await saveMeta(save.meta);

    store.set(unlockProgressionAtom, (prev) => ({
        ...prev,
        unlockedHeroes: [...prev.unlockedHeroes, hero]
    }));

    store.set(unlockToastAtom, prev => [
        ...prev,
        {
            name: HEROES[hero].name,
            icon: HEROES[hero].sprite
        }
    ]);
}

export function getUnlockDescription(heroId: Exclude<HeroId, "archer" | "necromancer">, progress: MetaProgress) {
    const unlock = HERO_UNLOCKS[heroId];

    switch (unlock.type) {
        case "spells_cast":
            return `Cast ${Math.min(progress.spellsCast, unlock.amount)}/${unlock.amount} spells`;

        case "complete_level_no_loss":
            return `Complete ${Math.min(progress.levelsWithoutLivesLost, unlock.amount)}/${unlock.amount} levels without losing lives`;

        case "boss_kills":
            return `Defeat ${Math.min(progress.bossesKilled, unlock.amount)}/${unlock.amount} bosses`;

        case "chests_opened":
            return `Open ${Math.min(progress.chestsOpened, unlock.amount)}/${unlock.amount} chests`;

        case "poison_enemies":
            return `Poison ${Math.min(progress.enemiesPoisoned, unlock.amount)}/${unlock.amount} enemies`;

        case "complete_hard":
            return "Beat both campaigns on hard difficulty";

        case "endless_level":
            return `Reach wave ${unlock.amount} on endless mode`;

        default: return null;
    }
}

export function spellProgress() {
    store.set(unlockProgressionAtom, prev => ({
        ...prev,
        spellsCast: prev.spellsCast + 1
    }));

    checkUnlocks(store.get(unlockProgressionAtom));
}

export function chestProgress() {
    store.set(unlockProgressionAtom, prev => ({
        ...prev,
        chestsOpened: prev.chestsOpened + 1
    }));

    checkUnlocks(store.get(unlockProgressionAtom));
}

export function bossKillProgress() {
    store.set(unlockProgressionAtom, prev => ({
        ...prev,
        bossesKilled: prev.bossesKilled + 1
    }));

    checkUnlocks(store.get(unlockProgressionAtom));
}

export function poisonProgress() {
    store.set(unlockProgressionAtom, prev => ({
        ...prev,
        enemiesPoisoned: prev.enemiesPoisoned + 1
    }));

    checkUnlocks(store.get(unlockProgressionAtom));
}

export function levelNoLivesLostProgress() {
    store.set(unlockProgressionAtom, prev => ({
        ...prev,
        levelsWithoutLivesLost: prev.levelsWithoutLivesLost + 1
    }));

    checkUnlocks(store.get(unlockProgressionAtom));
}

export async function saveMetaProgress() {
    const save = await getSave();
    if (save?.meta) {
        const unlockProgression = store.get(unlockProgressionAtom);
        const meta = save.meta;
        meta.campaignLevelsCompleted = unlockProgression.campaignLevelsCompleted;
        meta.spellsCast = unlockProgression.spellsCast;
        meta.levelsWithoutLivesLost = unlockProgression.levelsWithoutLivesLost;
        meta.bossesKilled = unlockProgression.bossesKilled;
        meta.chestsOpened = unlockProgression.chestsOpened;
        meta.enemiesPoisoned = unlockProgression.enemiesPoisoned;
        meta.completedCampaigns = unlockProgression.completedCampaigns;

        await saveMeta(meta);
    }
}

export function completeCampaign(world: 1 | 2, difficulty: "normal" | "hard" | "expert") {
    if (store.get(unlockProgressionAtom).completedCampaigns.some(c => c.world === world && c.difficulty === difficulty)) return;
    store.set(unlockProgressionAtom, prev => ({
        ...prev,
        completedCampaigns: [...prev.completedCampaigns, { world, difficulty }]
    }));
}