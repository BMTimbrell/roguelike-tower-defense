import type { HeroGameObj, HeroSkillDef } from "../types";

export default function isNoPreqrequisites(hero: HeroGameObj, skill: HeroSkillDef): boolean {
    if (!skill.requires) return true;

    return skill.requires.every(reqId =>
        hero.skillIds.some(id => id === reqId)
    );
}