import type { GameObj, KAPLAYCtx } from "kaplay";
import { gameStateAtom, store } from "../store";

export function lifespan(k: KAPLAYCtx, duration: number) {
    return {
        timeLeft: duration,

        update(this: GameObj & { timeLeft: number }) {
            const timeScale = store.get(gameStateAtom).timeScale;
            const dt = k.dt() * timeScale;

            this.timeLeft -= dt;

            if (this.timeLeft <= 0) {
                k.destroy(this);
            }
        }
    };
}