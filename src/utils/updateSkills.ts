import { SKILLS } from "../constants";
import { rewardsAtom, store } from "../store";
import type { HeroGameObj } from "../types";
import isNoPrerequisites from "./isNoPrerequisites";

export default function updateSkills(hero: HeroGameObj) {
    store.set(rewardsAtom, prev => ({
        ...prev,
        skills: [
            ...SKILLS.filter(
                s => s.heroIds.some(id => id === hero.heroId) &&
                    hero.skillIds.every(id => id !== s.id) &&
                    isNoPrerequisites(hero, s)
            ).map(s => s.id)
        ]
    }));
}