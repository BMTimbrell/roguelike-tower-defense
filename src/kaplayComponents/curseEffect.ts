import type { KAPLAYCtx, Comp, GameObj} from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";

export type CurseComp = Comp & {
    id: StatusEffect;
    refreshCurse: () => void;
    curse: () => StatusEffectResult;
};

export default function burnEffect(k: KAPLAYCtx, duration: number): CurseComp {
    let timer = duration;

    return {
        id: "curse",

        require: ["statusEffect"],

        refreshCurse() {
            timer = duration;
        },

        curse() {
            return {
                icon: "curse"
            };
        },

        add(this: GameObj<StatusEffectComp>) {
            this.addStatus("curse");
        },

        destroy(this: GameObj<StatusEffectComp>) {
            this.removeStatus("curse");
        },

        update(this: GameObj<{ isDying: boolean }>) {
            timer -= k.dt();

            if (timer <= 0 || this.isDying) {
                this.unuse("curse");
            }
        },
    };
}