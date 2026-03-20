import type { KAPLAYCtx, Comp, HealthComp, GameObj, PosComp } from "kaplay";
import type { EnemyGameObj, StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import hurtEnemy from "../utils/hurtEnemy";

export type BurnComp = Comp & {
    id: StatusEffect;
    refreshBurn: () => void;
    burn: () => StatusEffectResult;
};

export default function burnEffect(k: KAPLAYCtx, duration: number): BurnComp {
    let timer = duration;
    const tickRate = 1;
    let tickTimer = tickRate;

    return {
        id: "burn",

        require: ["health", "pos", "statusEffect"],

        refreshBurn(this: GameObj<{ debuffDurationMultiplier: number; }>) {
            timer = duration * this.debuffDurationMultiplier;
        },

        burn() {
            return {
                icon: "burn"
            };
        },

        add(this: GameObj<StatusEffectComp | { debuffDurationMultiplier: number; }>) {
            timer *= this.debuffDurationMultiplier;
            this.addStatus("burn");
        },

        destroy(this: GameObj<StatusEffectComp>) {
            this.removeStatus("burn");
        },

        update(this: GameObj<HealthComp | PosComp | { isDying: boolean, armour: number; }>) {
            tickTimer += k.dt();
            timer -= k.dt();

            if (tickTimer >= tickRate) {
                tickTimer -= tickRate;

                const damage = Math.min(Math.max(1, Math.round((this.maxHP() ?? 0) * 0.01)), 10);
                hurtEnemy(k, { target: this as EnemyGameObj, element: "Fire", damage, isCrit: false, statusDamage: true, ignoreArmour: true });
            }

            if (timer <= 0 || this.isDying) {
                this.unuse("burn");
            }
        },
    };
}