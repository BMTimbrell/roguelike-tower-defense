import type { KAPLAYCtx, Vec2 } from "kaplay";
import { chestAtom, store } from "../store";
import { playUISound } from "../utils/soundHelpers";

export default function makeChest(k: KAPLAYCtx, pos: Vec2) {
    const chest = k.add([
        k.sprite("treasure chest"),
        k.pos(pos),
        k.area(),
        k.z(99),
        k.anchor("center"),
        k.color(255, 255, 0)
    ]);

    let sparkleTimer = 0;

    function resetSparkleTimer() {
        sparkleTimer = k.rand(0.06, 0.035);
    }

    resetSparkleTimer();

    chest.onUpdate(() => {
        sparkleTimer -= k.dt();

        if (sparkleTimer <= 0) {
            resetSparkleTimer();

            const start = chest.pos.add(
                k.vec2(
                    k.rand(-chest.width / 2, chest.width / 2),
                    k.rand(-chest.height / 2, chest.height / 2),
                )
            );

            const size = k.randi(2, 3);

            const lifespan = k.rand(0.3, 0.6);

            const spark = k.add([
                k.rect(size, size),
                k.pos(start),
                k.anchor("center"),
                k.color(255, 240, 100),
                k.scale(1),
                k.opacity(1),
                k.lifespan(lifespan),
                k.z(100),
            ]);

            k.tween(
                0,
                1,
                lifespan,
                (t) => {
                    spark.pos = start.add(k.vec2(0, -4 * t));
                    spark.opacity = 1 - t;
                    spark.scale = k.vec2(1 + t);
                }
            );
        }
    });

    chest.onClick(() => {
        playUISound(k, "open chest");
        store.set(chestAtom, prev => ({ ...prev, visible: true }));
        k.destroy(chest);
        k.get("*").forEach(obj => obj.paused = true);
    });
}