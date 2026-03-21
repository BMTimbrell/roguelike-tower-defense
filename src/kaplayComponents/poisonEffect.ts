import type { KAPLAYCtx, Comp, HealthComp, GameObj, PosComp } from "kaplay";
import type { EnemyGameObj, StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import hurtEnemy from "../utils/hurtEnemy";
import { MAX_POISON_STACKS } from "../constants";

export type PoisonComp = Comp & {
    id: StatusEffect;
    addPoisonStack: (num: number) => void;
    poison: () => StatusEffectResult;
};

export default function poisonEffect(k: KAPLAYCtx, stacks: number): PoisonComp {
    const tickRate = 5;
    let tickTimer = 0;
    stacks = Math.min(stacks, MAX_POISON_STACKS);

    return {
        id: "poison",

        require: ["health", "pos", "statusEffect"],

        addPoisonStack(num) {
            if (stacks < MAX_POISON_STACKS) stacks += Math.min(num, MAX_POISON_STACKS - stacks);
        },

        poison() {
            return {
                icon: "poison",
                stacks
            };
        },

        add(this: GameObj<StatusEffectComp>) {
            this.addStatus("poison");
        },

        destroy(this: GameObj<StatusEffectComp>) {
            this.removeStatus("poison");
        },

        update(this: GameObj<HealthComp | PosComp | { isDying: boolean }>) {
            tickTimer += k.dt();

            if (tickTimer >= tickRate) {
                tickTimer -= tickRate;

                const damage = stacks;

                hurtEnemy(k, { target: this as EnemyGameObj, element: "Poison", damage, isCrit: false, statusDamage: true, ignoreArmour: true });
            }

            if (this.isDying) {
                this.unuse("poison");
            }
        },
    };
}