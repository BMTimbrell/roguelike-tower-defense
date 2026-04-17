import type { Comp, GameObj, KAPLAYCtx } from "kaplay";
import type { EnemyGameObj } from "../types";

export default function healthBar(k: KAPLAYCtx, duration: number, opts?: { isBoss: boolean }): Comp {
    let timer = duration;

    return {
        id: "healthBar",

        require: ["health", "sprite", "rotate"],

        draw(this: EnemyGameObj & { armour: number; maxArmour: number; }) {
            k.pushTransform();
            k.pushRotate(-this.angle);

            const hbBarPos = k.vec2(0).sub(
                this.width / 2,
                this.height - (this.height > 32 ? this.height * 0.5 : this.height * 0.25)
            );

            this.statuses.forEach((e, index) => {
                if (this.has(e)) {
                    const comp = this as typeof this & Record<typeof e, () => any>;
                    const effect = comp[e]();
                    if (!effect) return;

                    let effectPos = hbBarPos.sub(k.vec2(0 - index * 10, 11));
                    const stacks = effect?.stacks ?? 0;

                    k.drawSprite({
                        sprite: effect.icon,
                        pos: effectPos
                    });

                    if (stacks > 1) {
                        k.drawText({
                            color: k.rgb(0, 0, 0),
                            text: "x" + stacks,
                            size: 7,
                            pos: effectPos
                        });
                    }
                }
            });

            const hp = this.hp();
            const maxHP = this.maxHP() ?? 1;

            const armour = this.armour ?? 0;
            const maxArmour = this.maxArmour ?? 0;

            const total = maxHP + maxArmour;

            const hpWidth = this.width * (hp / total);
            const armourWidth = this.width * (armour / total);

            const barHeight = opts?.isBoss ? 12 : 4;

            // background
            k.drawRect({
                width: this.width,
                height: barHeight,
                pos: hbBarPos,
                color: k.Color.fromHex("#707070"),
                radius: 2
            });

            // HP (green)
            k.drawRect({
                width: hpWidth,
                height: barHeight,
                pos: hbBarPos,
                color: k.Color.fromHex("#5ba675"),
                radius: 2
            });

            // armor (yellow)
            k.drawRect({
                width: armourWidth,
                height: barHeight,
                pos: hbBarPos.add(hpWidth, 0),
                color: k.Color.fromHex("#e5c84b"),
                radius: 2
            });

            // outline
            k.drawRect({
                width: this.width,
                height: barHeight,
                pos: hbBarPos,
                outline: { color: k.Color.fromHex("#000000"), width: 1 },
                fill: false,
                radius: 2
            });

            if (opts?.isBoss) {
                k.drawText({
                    text: `${hp} / ${maxHP}`,
                    size: 8,
                    pos: hbBarPos.add(this.width / 2, barHeight / 2),
                    anchor: "center",
                    color: k.WHITE,
                });
            }

            k.popTransform();
        },

        update(this: GameObj) {
            if (opts?.isBoss) return;

            timer -= k.dt();

            if ((timer <= 0 || this.isDying) && this.statuses.length < 1) {
                this.unuse("healthBar");
            }
        }
    };
}