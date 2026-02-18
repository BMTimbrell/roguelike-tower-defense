import type { Comp } from "kaplay";

export type StatusEffect = "burn" | "poison";

export type StatusEffectComp = Comp & {
    statuses: StatusEffect[];
    addStatus: (name: StatusEffect) => void;
    removeStatus: (name: StatusEffect) => void;
};

export default function statusEffect(): StatusEffectComp {

    return {
        id: "statusEffect",

        statuses: [],

        addStatus(name) {
            if (!this.statuses.includes(name)) {
                this.statuses.push(name);
            }
        },

        removeStatus(name) {
            this.statuses = this.statuses.filter(s => s !== name);
        }
    };
}