import type { KAPLAYCtx, Comp, GameObj } from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { MAX_CHARGE_STACKS} from "../constants";

export type ChargeComp = Comp & {
    id: StatusEffect;
    addChargeStack: () => void;
    getChargeStacks: () => number;
    charge: () => StatusEffectResult;
};

export default function chargeEffect(k: KAPLAYCtx, duration: number): ChargeComp {
    let timer = duration;
    let stacks = 1;

    return {
        id: "charge",

        require: ["statusEffect"],

        addChargeStack(this: GameObj<{ debuffDurationMultiplier: number; }>) {
            timer = duration * this.debuffDurationMultiplier;
            if (stacks < MAX_CHARGE_STACKS) stacks++;
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
            timer -= k.dt();

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