import type { HeroSkillDef, Upgrade } from "../types";

export default function setCardAnimationDelay(index: number): number {
    return index * 80;
}