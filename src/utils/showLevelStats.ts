import type { KAPLAYCtx } from "kaplay";
import { store, gameStateAtom } from "../store";
import screenPos from "./screenPos";

export default function showLevelStats(k: KAPLAYCtx) {

    const heartPos = k.vec2(18, 39);

    const heart = k.add([
        k.sprite("heart"),
        k.scale(2),
        k.pos(heartPos),
        k.z(999),
        {
            update() {
                heart.pos = screenPos(k, heartPos);
            }
        }
    ]);

    const healthTextPos = heartPos.add(k.vec2(23, 0));

    const healthText = k.add([
        k.pos(healthTextPos),
        k.color('#FFFFFF'),
        k.text('' + store.get(gameStateAtom).health, {
            size: 20,
            font: "free pixel"
        }),
        k.z(999),
        {
            update() {
                healthText.use(k.text('' + store.get(gameStateAtom).health + '/' + store.get(gameStateAtom).maxHealth, {
                    size: 20,
                    font: "free pixel"
                }));
                healthText.pos = screenPos(k, healthTextPos);
            }
        }
    ]);

    const goldPos = k.vec2(21, 60);

    const gold = k.add([
        k.sprite("gold"),
        k.scale(2),
        k.pos(goldPos),
        k.z(999),
        {
            update() {
                gold.pos = screenPos(k, goldPos);
            }
        }
    ]);

    const goldTextPos = gold.pos.add(k.vec2(20, -1));

    const goldText = k.add([
        k.pos(goldTextPos),
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
                }));
                goldText.pos = screenPos(k, goldTextPos);
            }
        }
    ]);
}