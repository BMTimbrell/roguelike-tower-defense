import type { KAPLAYCtx, Comp } from "kaplay";
import type { EnemyGameObj, StatusEffectResult } from "../types";
import type { StatusEffect } from "./statusEffect";
import hurtEnemy from "../utils/hurtEnemy";
import { MAX_POISON_STACKS } from "../constants";

export type PoisonComp = Comp & {
    id: StatusEffect;
    addPoisonStack: (num: number) => void;
    poison: () => StatusEffectResult;
    removeStack: () => number;
};

export default function poisonEffect(k: KAPLAYCtx, stacks: number): PoisonComp {
    const tickRate = 5;
    let tickTimer = 0;
    const maxStacks = MAX_POISON_STACKS + (k.get("hero")[0]?.festeringToxins ? 5 : 0 );
    stacks = Math.min(stacks, maxStacks);

    return {
        id: "poison",

        require: ["health", "pos", "statusEffect"],

        addPoisonStack(num) {
            if (stacks < maxStacks) stacks += Math.min(num, maxStacks - stacks);
        },

        poison() {
            return {
                icon: "poison",
                stacks
            };
        },

        add(this: EnemyGameObj) {
            this.addStatus("poison");
        },

        destroy(this: EnemyGameObj) {
            this.removeStatus("poison");
        },

        removeStack() {
            stacks--;
            return stacks;
        },

        update(this: EnemyGameObj) {
            tickTimer += k.dt();

            if (tickTimer >= tickRate) {
                tickTimer -= tickRate;

                const damage = stacks + (k.get("hero")[0]?.hasDeadlyToxins ? stacks : 0);

                hurtEnemy(k, { target: this as EnemyGameObj, element: "Poison", damage, isCrit: false, statusDamage: true, ignoreArmour: true });

                if (k.get("hero")[0]?.hasCripplingToxins && Math.random() < 0.5 && !this.isDying) {
                    this.enterState("stunned");
                }
            }

            if (this.isDying) {
                this.unuse("poison");
            }
        },
    };
}