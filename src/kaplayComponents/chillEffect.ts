import type { KAPLAYCtx, Comp, GameObj } from "kaplay";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { CHILL_PERCENT, MAX_CHILL_STACKS } from "../constants";

export type ChillComp = Comp & {
    id: StatusEffect;
    addChillStack: () => void;
    chill: () => StatusEffectResult;
};

export default function chillEffect(k: KAPLAYCtx, duration: number): ChillComp {
    let timer = duration;
    let stacks = 1;

    return {
        id: "chill",

        require: ["statusEffect"],

        addChillStack(this: GameObj<{ speed: number; baseSpeed: number; }>) {
            timer = duration;
            if (stacks < MAX_CHILL_STACKS) stacks++;
            this.speed = this.baseSpeed * (1 - ((stacks * CHILL_PERCENT) / 100));
        },

        chill() {
            return {
                icon: "chill",
                stacks
            };
        },

        add(this: GameObj<StatusEffectComp | { speed: number; baseSpeed: number; }>) {
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
                console.log(this.speed)
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