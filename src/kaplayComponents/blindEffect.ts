import type { KAPLAYCtx, Comp, GameObj } from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { gameStateAtom, store } from "../store";

export type CurseComp = Comp & {
    id: StatusEffect;
    refreshBlind: () => void;
    blind: () => StatusEffectResult;
};

export default function blindEffect(k: KAPLAYCtx, duration: number): CurseComp {
    let timer = duration;

    return {
        id: "blind",

        require: ["statusEffect"],

        refreshBlind() {
            timer = duration;
        },

        blind() {
            return {
                icon: "blind"
            };
        },

        add(this: GameObj<StatusEffectComp | { debuffDurationMultiplier: number; }>) {
            this.debuffDurationMultiplier = 1.5;
            this.addStatus("blind");
        },

        destroy(this: GameObj<StatusEffectComp | { debuffDurationMultiplier: number; }>) {
            this.debuffDurationMultiplier = 1;
            this.removeStatus("blind");
        },

        update(this: GameObj<{ isDying: boolean }>) {
            timer -= k.dt() * store.get(gameStateAtom).timeScale;

            if (timer <= 0 || this.isDying) {
                this.unuse("blind");
            }
        },
    };
}