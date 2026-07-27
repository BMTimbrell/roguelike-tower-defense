import type { KAPLAYCtx, Comp } from "kaplay";
import type { EnemyGameObj, StatusEffectResult } from "../types";
import type { StatusEffect } from "./statusEffect";
import { CHILL_PERCENT, MAX_CHILL_STACKS } from "../constants";
import { updateSpeed } from "../entities/Enemy";
import { gameStateAtom, store } from "../store";

export type ChillComp = Comp & {
    id: StatusEffect;
    addChillStack: (num: number, maxLimit: number, refreshDuration: boolean) => void;
    chill: () => StatusEffectResult;
};

export default function chillEffect(
    k: KAPLAYCtx,
    duration: number,
    stacks: number,
    maxLimit = MAX_CHILL_STACKS
): ChillComp {

    let normalStacks = Math.min(stacks, MAX_CHILL_STACKS);
    let bonusStacks = maxLimit > MAX_CHILL_STACKS ? Math.max(0, stacks - MAX_CHILL_STACKS) : 0;

    let timer = duration;

    function updateChill(enemy: EnemyGameObj) {
        const totalStacks = normalStacks + bonusStacks;
        const chillMultiplier = 1 - ((totalStacks * CHILL_PERCENT) / 100);
        enemy.speedMultipliers.chill = chillMultiplier;
        updateSpeed.call(enemy);
    }

    return {
        id: "chill",

        require: ["statusEffect"],

        addChillStack(this: EnemyGameObj, num, maxLimit, refreshDuration = true) {

            if (refreshDuration) {
                // Don't refresh while bonus stacks are active
                if (bonusStacks === 0) {
                    timer = duration * this.debuffDurationMultiplier;
                }

                const maxNormal = Math.min(maxLimit, MAX_CHILL_STACKS);
                normalStacks = Math.min(normalStacks + num, maxNormal);
            }
            else {
                const total = normalStacks + bonusStacks;
                const newTotal = Math.min(total + num, maxLimit);

                // Start the timer only if there weren't already bonus stacks
                if (bonusStacks === 0) {
                    timer = duration * this.debuffDurationMultiplier;
                }

                bonusStacks += newTotal - total;
            }

            updateChill(this);
        },

        chill() {
            return {
                icon: "chill",
                stacks: normalStacks + bonusStacks,
            };
        },

        add(this: EnemyGameObj) {
            timer *= this.debuffDurationMultiplier;

            this.addStatus("chill");
            updateChill(this);
        },

        destroy(this: EnemyGameObj) {
            this.speedMultipliers.chill = 1;
            updateSpeed.call(this);
            this.removeStatus("chill");
        },

        update(this: EnemyGameObj) {

            const dt = k.dt() * store.get(gameStateAtom).timeScale;
            timer -= dt;
            if (timer <= 0) {
                if (bonusStacks > 0) {
                    bonusStacks--;
                } else {
                    normalStacks--;
                }

                timer += duration;
                updateChill(this);
            }

            if (normalStacks + bonusStacks <= 0 || this.isDying) {
                this.unuse("chill");
            }
        },
    };
}