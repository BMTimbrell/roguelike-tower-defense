import type { KAPLAYCtx } from "kaplay";
import { gameStateAtom, store } from "../store";

export default function setGameSpeed(k: KAPLAYCtx, speed: number) {
    store.set(gameStateAtom, prev => ({
        ...prev,
        timeScale: speed
    }));

    k.get("*").forEach(obj => obj.animSpeed = speed);
}