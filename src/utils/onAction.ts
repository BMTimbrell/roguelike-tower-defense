import type { KAPLAYCtx } from "kaplay";
import { controlsAtom, store } from "../store";

export default function onAction(k: KAPLAYCtx, action: string, handlers: {
    onPress?: () => void;
    onRelease?: () => void;
}) {
    let wasDown = false;

    k.onUpdate(() => {
        const binding = store.get(controlsAtom).getButton(action);

        let isDown = false;

        if (binding.keyboard && k.isKeyDown(binding.keyboard)) {
            isDown = true;
        }

        if (binding.mouse && k.isMouseDown(binding.mouse)) {
            isDown = true;
        }

        if (isDown && !wasDown) {
            handlers.onPress?.();
        }

        if (!isDown && wasDown) {
            handlers.onRelease?.();
        }

        wasDown = isDown;
    });
}