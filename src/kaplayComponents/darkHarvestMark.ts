import type { KAPLAYCtx, Comp, GameObj} from "kaplay";
import type { EnemyGameObj, StatusEffectResult } from "../types";
import type { StatusEffect, StatusEffectComp } from "./statusEffect";
import { gameStateAtom, store } from "../store";
import hurtEnemy from "../utils/hurtEnemy";
import { playUISound } from "../utils/soundHelpers";
import { spawnDarkBurst, spawnDarkHarvestEffect } from "../utils/spellHelpers";
import { waitScaled } from "../utils/timerFunctions";

export type DarkHarvestComp = Comp & {
    id: StatusEffect;
    refreshMark: () => void;
    darkHarvestMark: () => StatusEffectResult;
};

export default function darkHarvestEffect(k: KAPLAYCtx, duration: number): DarkHarvestComp {
    let timer = duration;

    return {
        id: "darkHarvestMark",

        require: ["statusEffect"],

        refreshMark() {
            timer = duration;
        },

        darkHarvestMark() {
            return {
                icon: "dark harvest mark"
            };
        },

        add(this: GameObj<StatusEffectComp | { debuffDurationMultiplier: number; }>) {
            timer = duration * this.debuffDurationMultiplier;
            this.addStatus("darkHarvestMark");
        },

        destroy(this: GameObj<StatusEffectComp>) {
            this.removeStatus("darkHarvestMark");
        },

        update(this: EnemyGameObj) {
            timer -= k.dt() * store.get(gameStateAtom).timeScale;

            if (timer <= 0 || this.isDying) {
                this.unuse("darkHarvestMark");
                if (timer <= 0) {
                    playUISound(k, "ghosts");
                    const darkHarvestLoop = k.loop(0.05, () => spawnDarkHarvestEffect(k, this));
                    waitScaled(k, 0.1, () => {
                        darkHarvestLoop.cancel();
                        spawnDarkBurst(k, this.pos);
                        waitScaled(k, 0.15, () => {
                            hurtEnemy(k, { 
                                target: this,
                                isCrit: false,
                                damage: Math.round(this.darkHarvestDamage * 0.4),
                                element: "Dark",
                                zIndexBonus: 10
                            });
                        });
                    });

                }
            }
        },
    };
}