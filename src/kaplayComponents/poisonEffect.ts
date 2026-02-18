import type { KAPLAYCtx, Comp, HealthComp, GameObj, PosComp } from "kaplay";
import makeFloatingText from "../entities/FloatingText";
import { ELEMENTS, SMALL_DAMAGE_NUMBER_SIZE } from "../constants";
import type { StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";

export type PoisonComp = Comp & {
    id: StatusEffect;
    addPoisonStack: () => void;
    poison: () => StatusEffectResult;
};

export default function poisonEffect(k: KAPLAYCtx): PoisonComp {
    const tickRate = 5;
    let tickTimer = 0;
    let stacks = 1;

    return {
        id: "poison",

        require: ["health", "pos", "statusEffect"],

        addPoisonStack() {
            if (stacks < 5) stacks++;
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
                this.hurt(damage);

                makeFloatingText(k, {
                    pos: this.pos,
                    text: '' + damage,
                    size: SMALL_DAMAGE_NUMBER_SIZE,
                    color: ELEMENTS["Poison"].color
                });
            }

            if (this.isDying) {
                this.unuse("poison");
            }
        },
    };
}