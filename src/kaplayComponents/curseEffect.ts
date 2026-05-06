import type { KAPLAYCtx, Comp, GameObj} from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { gameStateAtom, store } from "../store";

export type CurseComp = Comp & {
    id: StatusEffect;
    refreshCurse: () => void;
    curse: () => StatusEffectResult;
};

export default function curseEffect(k: KAPLAYCtx, duration: number): CurseComp {
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

        add(this: GameObj<StatusEffectComp | { debuffDurationMultiplier: number; }>) {
            timer = duration * this.debuffDurationMultiplier;
            this.addStatus("curse");
        },

        destroy(this: GameObj<StatusEffectComp>) {
            this.removeStatus("curse");
        },

        update(this: GameObj<{ isDying: boolean }>) {
            timer -= k.dt() * store.get(gameStateAtom).timeScale;

            if (timer <= 0 || this.isDying) {
                this.unuse("curse");
            }
        },
    };
}