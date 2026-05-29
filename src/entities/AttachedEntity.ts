import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { ElementName, EnemyGameObj } from "../types";
import { gameStateAtom, store } from "../store";
import hurtEnemy from "../utils/hurtEnemy";
import { playSfx } from "../utils/soundHelpers";

export default function makeAttachedEntity(k: KAPLAYCtx, opts: {
    sprite: string;
    enemy: EnemyGameObj;
    damage: number;
    isCrit: boolean;
    ticks: number;
    interval: number;
    element: ElementName;
    angle: number;
    stickDir: Vec2;
    offset: number;
    infectionLevel?: number;
    sound?: string;
}) {
    const { enemy, isCrit, ticks, interval, element, sprite, angle } = opts;
    let damage = opts.damage;
    let infectionLevel = opts.infectionLevel;
    const sound = opts?.sound;

    let timer = interval;
    let remaining = ticks;

    const entity = k.add([
        k.sprite(sprite, { anim: "idle" }),
        k.pos(enemy.pos),
        k.rotate(angle),
        k.anchor("center"),
        k.z(999999)
    ]);

    entity.animSpeed = store.get(gameStateAtom).timeScale;

    entity.onAnimEnd(anim => {
        if (anim === "damage") {
            if (remaining <= 0 || enemy.isDying) {
                if (infectionLevel && infectionLevel < 3) {
                    infectionLevel++;
                    damage = Math.round(damage * 1.5);
                    remaining = ticks;
                    entity.use(k.sprite(`${sprite} ${infectionLevel}`));
                } else {
                    k.destroy(entity);
                }
            }
            entity.play("idle");
        }
    })

    const stickOffset = opts.stickDir.scale(opts.offset);

    entity.onUpdate(() => {
        if (enemy.isDying && entity.getCurAnim()?.name === "idle") {
            k.destroy(entity);
            return;
        }

        const timeScale = store.get(gameStateAtom).timeScale;

        entity.pos = enemy.pos.add(stickOffset);

        timer -= k.dt() * timeScale;

        if (timer <= 0) {
            timer += interval;

            hurtEnemy(k, {
                target: enemy,
                damage,
                isCrit,
                element
            });

            remaining--;

            entity.play("damage");
            if (sound) playSfx(k, sound);
        }
    });
}