import type { KAPLAYCtx, Comp, GameObj } from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { MAX_CHARGE_STACKS } from "../constants";
import { gameStateAtom, store } from "../store";

export type ChargeComp = Comp & {
    id: StatusEffect;
    addChargeStack: (num: number) => void;
    getChargeStacks: () => number;
    charge: () => StatusEffectResult;
};

export default function chargeEffect(k: KAPLAYCtx, duration: number, stacks: number): ChargeComp {
    let timer = duration;
    stacks = Math.min(stacks, MAX_CHARGE_STACKS);

    return {
        id: "charge",

        require: ["statusEffect"],

        addChargeStack(this: GameObj<{ debuffDurationMultiplier: number; }>, num) {
            timer = duration * this.debuffDurationMultiplier;
            if (stacks < MAX_CHARGE_STACKS) stacks += Math.min(num, MAX_CHARGE_STACKS - stacks);
        },

        getChargeStacks(this: GameObj) {
            return stacks;
        },

        charge() {
            return {
                icon: "charge",
                stacks
            };
        },

        add(this: GameObj<StatusEffectComp | { debuffDurationMultiplier: number; }>) {
            timer *= this.debuffDurationMultiplier;
            this.addStatus("charge");
        },

        destroy(this: GameObj<StatusEffectComp>) {
            this.removeStatus("charge");
        },

        update(this: GameObj<{ isDying: boolean; }>) {
            timer -= k.dt() * store.get(gameStateAtom).timeScale;

            if (timer <= 0) {
                stacks--;
                timer += duration;
            }

            if (stacks < 1 || this.isDying) {
                this.unuse("charge");
            }
        },
    };
}