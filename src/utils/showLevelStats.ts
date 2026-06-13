import type { KAPLAYCtx } from "kaplay";
import { store, gameStateAtom, mapAtom } from "../store";

export default function showLevelStats(k: KAPLAYCtx) {
    let scale = store.get(mapAtom).iconScale;
    let fontSize = 20 * scale;
    let heartPos = k.vec2(18 * scale, 39 * scale);
    let healthTextPos = heartPos.add(k.vec2(23 * scale, 0 * scale));

    let opacity = store.get(gameStateAtom).hideUI ? 0 : 1;

    const heart = k.add([
        k.sprite("heart"),
        k.scale(2 * scale),
        k.pos(heartPos),
        k.fixed(),
        k.opacity(opacity),
        k.z(999),
        {
            update() {
                heart.scale = k.vec2(2 * scale);
                heart.pos = heartPos;
                heart.opacity = opacity;
            }
        }
    ]);

    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    offsets.map(([x, y]) => {
        const outline = k.add([
            k.pos(healthTextPos.x + x * scale, healthTextPos.y + y * scale),
            k.color('#000000'),
            k.text('' + store.get(gameStateAtom).health, {
                size: fontSize,
                font: "free pixel"
            }),
            k.opacity(opacity),
            k.fixed(),
            k.z(999),
            {
                update() {
                    outline.text = '' + store.get(gameStateAtom).health + '/' + store.get(gameStateAtom).maxHealth;
                    outline.textSize = fontSize;
                    outline.pos = k.vec2(healthTextPos.x + x * scale, healthTextPos.y + y * scale);
                    outline.opacity = opacity;
                }
            }
        ]);

    });

    const healthText = k.add([
        k.pos(healthTextPos),
        k.color('#FFFFFF'),
        k.text('' + store.get(gameStateAtom).health, {
            size: fontSize,
            font: "free pixel"
        }),
        k.z(999),
        k.opacity(opacity),
        k.fixed(),
        {
            update() {
                healthText.text = '' + store.get(gameStateAtom).health + '/' + store.get(gameStateAtom).maxHealth;
                healthText.textSize = fontSize;
                healthText.pos = healthTextPos;
                healthText.opacity = opacity;
            }
        }
    ]);

    let goldPos = k.vec2(21 * scale, 60 *scale);

    const gold = k.add([
        k.sprite("gold"),
        k.scale(2 * scale),
        k.pos(goldPos),
        k.z(999),
        k.fixed(),
        k.opacity(opacity),
        {
            update() {
                gold.scale = k.vec2(2 * scale);
                gold.pos = goldPos;
                gold.opacity = opacity;
            }
        }
    ]);

    
    let goldTextPos = gold.pos.add(k.vec2(20 * scale, -1 * scale));

    offsets.map(([x, y]) => {
        const outline = k.add([
            k.pos(goldTextPos.x + x * scale, goldTextPos.y + y * scale),
            k.color('#000000'),
            k.text('' + store.get(gameStateAtom).gold, {
                size: fontSize,
                font: "free pixel"
            }),
            k.opacity(opacity),
            k.z(999),
            k.fixed(),
            {
                update() {
                    outline.text = '' + store.get(gameStateAtom).gold;
                    outline.textSize = fontSize;
                    outline.pos = k.vec2(goldTextPos.x + x * scale, goldTextPos.y + y * scale);
                    outline.opacity = opacity;
                }
            }
        ]);

    });

    const goldText = k.add([
        k.pos(goldTextPos),
        k.color('#FFFFFF'),
        k.text('' + store.get(gameStateAtom).gold, {
            size: fontSize,
            font: "free pixel"
        }),
        k.z(999),
        k.opacity(opacity),
        k.fixed(),
        {
            update() {
                goldText.text = '' + store.get(gameStateAtom).gold;
                goldText.textSize = fontSize;
                goldText.pos = goldTextPos;
                goldText.opacity = opacity;
            }
        }
    ]);

    k.onUpdate(() => {
        scale = store.get(mapAtom).iconScale;
        fontSize = 20 * scale;

        heartPos = k.vec2(18 * scale, 39 * scale);
        healthTextPos = heartPos.add(k.vec2(23 * scale, 0 * scale));

        goldPos = k.vec2(21 * scale, 60 *scale);
        goldTextPos = gold.pos.add(k.vec2(20 * scale, -1 * scale));
        opacity = store.get(gameStateAtom).hideUI || store.get(gameStateAtom).gameOver ? 0 : 1;
    });

}