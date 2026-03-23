import type { KAPLAYCtx, Comp, GameObj } from "kaplay";
import type { EnemyGameObj, StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { CHILL_PERCENT, MAX_CHILL_STACKS } from "../constants";
import { updateSpeed } from "../entities/Enemy";

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

        addChillStack(this: EnemyGameObj, num) {
            timer = duration * this.debuffDurationMultiplier;
            if (stacks < MAX_CHILL_STACKS) stacks += Math.min(num, MAX_CHILL_STACKS - stacks);
            const chillMultiplier = 1 - ((stacks * CHILL_PERCENT) / 100);
            this.speedMultipliers.chill = chillMultiplier;
            updateSpeed.call(this);
        },

        chill() {
            return {
                icon: "chill",
                stacks
            };
        },

        add(this: EnemyGameObj) {
            timer *= this.debuffDurationMultiplier;
            this.addStatus("chill");
            const chillMultiplier = 1 - ((stacks * CHILL_PERCENT) / 100);
            this.speedMultipliers.chill = chillMultiplier;
            updateSpeed.call(this);
        },

        destroy(this: EnemyGameObj) {
            this.speedMultipliers.chill = 1;
            updateSpeed.call(this);
            this.removeStatus("chill");
        },

        update(this: EnemyGameObj) {
            timer -= k.dt();

            if (timer <= 0) {
                stacks--;
                const chillMultiplier = 1 - ((stacks * CHILL_PERCENT) / 100);
                this.speedMultipliers.chill = chillMultiplier;
                updateSpeed.call(this);
                timer += duration;
            }

            if (stacks < 1 || this.isDying) {
                this.unuse("chill");
            }
        },
    };
}