import type { KAPLAYCtx } from "kaplay";
import type { Controls } from "../types";

export default function isButtonDown(k: KAPLAYCtx, controls: Controls, action: string) {
    const binding = controls.getButton(action);

    if (binding.keyboard && k.isKeyDown(binding.keyboard)) return true;
    if (binding.mouse && k.isMouseDown(binding.mouse)) return true;

    return false;
}