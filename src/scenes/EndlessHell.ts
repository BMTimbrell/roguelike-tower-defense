import type { KAPLAYCtx } from "kaplay";
import makeEndlessScene from "../utils/makeEndlessScene";

export default function endlessHell(k: KAPLAYCtx) {
    makeEndlessScene(k, "endlessHell");
}