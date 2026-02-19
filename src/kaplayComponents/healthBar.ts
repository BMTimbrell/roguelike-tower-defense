import type { Comp, GameObj, HealthComp, KAPLAYCtx, RotateComp, SpriteComp } from "kaplay";
import type { PoisonComp } from "./poisonEffect";
import type { BurnComp } from "./burnEffect";
import type { StatusEffectComp } from "./statusEffect";
import type { ChillComp } from "./chillEffect";
import type { ChargeComp } from "./chargeEffect";

export default function healthBar(k: KAPLAYCtx, duration: number): Comp {
    let timer = duration;

    return {
        id: "healthbar",

        require: ["health", "sprite", "rotate"],

        draw(this: GameObj<HealthComp | SpriteComp | RotateComp | PoisonComp | BurnComp | ChillComp | ChargeComp | StatusEffectComp>) {
            k.pushTransform();
            k.pushRotate(-this.angle);

            const hbBarPos = k.vec2(0).sub(this.width / 2, this.height);

            this.statuses.forEach((e, index) => {
                if (this.has(e)) {
                    const effect = this[e]?.();
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

            k.drawRect({
                width: this.width,
                height: 4,
                pos: hbBarPos,
                color: k.Color.fromHex("#707070"),
                radius: 2
            });

            k.drawRect({
                width: this.width * (this.hp() / (this.maxHP() ?? 1)),
                height: 4,
                pos: hbBarPos,
                color: k.Color.fromHex("#5ba675"),
                radius: 2
            });

            k.drawRect({
                width: this.width,
                height: 4,
                pos: hbBarPos,
                outline: { color: k.Color.fromHex("#000000"), width: 1 },
                fill: false,
                radius: 2
            });

            k.popTransform();
        },

        update(this: GameObj) {
            timer -= k.dt();

            if ((timer <= 0 || this.isDying) && this.statuses.length < 1) {
                this.unuse("healthbar");
            }
        },
    };
}