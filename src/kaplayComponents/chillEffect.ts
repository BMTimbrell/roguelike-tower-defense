import type { KAPLAYCtx, Comp, GameObj } from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { CHILL_PERCENT, MAX_CHILL_STACKS } from "../constants";

export type ChillComp = Comp & {
    id: StatusEffect;
    addChillStack: (num: number) => void;
    chill: () => StatusEffectResult;
};

export default function chillEffect(k: KAPLAYCtx, duration: number, stacks: number): ChillComp {
    let timer = duration;
    stacks = Math.min(stacks, MAX_CHILL_STACKS);

    return {
        id: "chill",

        require: ["statusEffect"],

        addChillStack(this: GameObj<{ speed: number; baseSpeed: number; debuffDurationMultiplier: number; }>, num) {
            timer = duration * this.debuffDurationMultiplier;
            if (stacks < MAX_CHILL_STACKS) stacks += Math.min(num, MAX_CHILL_STACKS - stacks);
            this.speed = this.baseSpeed * (1 - ((stacks * CHILL_PERCENT) / 100));
        },

        chill() {
            return {
                icon: "chill",
                stacks
            };
        },

        add(this: GameObj<StatusEffectComp | { speed: number; baseSpeed: number; debuffDurationMultiplier: number; }>) {
            timer *= this.debuffDurationMultiplier;
            this.addStatus("chill");
            this.speed = this.baseSpeed * (1 - ((stacks * CHILL_PERCENT) / 100));
        },

        destroy(this: GameObj<StatusEffectComp | { speed: number; baseSpeed: number; }>) {
            this.speed = this.baseSpeed;
            this.removeStatus("chill");
        },

        update(this: GameObj<{ isDying: boolean; speed: number; baseSpeed: number; }>) {
            timer -= k.dt();

            if (timer <= 0) {
                stacks--;
                this.speed = this.baseSpeed * (1 - ((stacks * CHILL_PERCENT) / 100));
                timer += duration;
            }

            if (stacks < 1 || this.isDying) {
                this.unuse("chill");
            }
        },
    };
}