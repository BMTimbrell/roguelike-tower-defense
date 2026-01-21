import type { KAPLAYCtx } from "kaplay";
import { store, gameStateAtom } from "../store";

export default function showLevelStats(k: KAPLAYCtx) {
    k.add([
        k.sprite("heart"),
        k.scale(2),
        k.pos(18, 39),
        k.z(999)
    ]);

    const healthText = k.add([
        k.pos(41, 39),
        k.color('#FFFFFF'),
        k.text('' + store.get(gameStateAtom).health, {
            size: 20,
            font: "free pixel"
        }),
        k.z(999),
        {
            update() {
                healthText.use(k.text('' + store.get(gameStateAtom).health, {
                    size: 20,
                    font: "free pixel"
                }))
            }
        }
    ]);

    k.add([
        k.sprite("gold"),
        k.scale(2),
        k.pos(21, 60),
        k.z(999)
    ]);

    const goldText = k.add([
        k.pos(41, 59),
        k.color('#FFFFFF'),
        k.text('' + store.get(gameStateAtom).gold, {
            size: 20,
            font: "free pixel"
        }),
        k.z(999),
        {
            update() {
                goldText.use(k.text('' + store.get(gameStateAtom).gold, {
                    size: 20,
                    font: "free pixel"
                }))
            }
        }
    ]);
}